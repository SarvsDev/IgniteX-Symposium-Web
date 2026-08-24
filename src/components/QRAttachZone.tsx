import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Clipboard,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Eye,
  QrCode,
  Download,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { compressImageFile } from '../lib/imageCompressor';
import { soundFx } from './AudioEffects';

interface QRAttachZoneProps {
  value: string; // Data URL or URL of the attached QR/screenshot
  fileName?: string | null;
  onChange: (dataUrl: string, fileName: string) => void;
  onClear: () => void;
  label?: string;
  required?: boolean;
  upiAmount?: number;
  upiId?: string;
}

export const QRAttachZone: React.FC<QRAttachZoneProps> = ({
  value,
  fileName,
  onChange,
  onClear,
  label = 'ATTACH PAYMENT QR / SCREENSHOT PROOF',
  required = true,
  upiAmount,
  upiId = 'sarveshv6413@okaxis'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Process a File object into compressed data URL
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WebP).');
      soundFx.playAlert();
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 25MB. Please choose a smaller image.');
      soundFx.playAlert();
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const compressedData = await compressImageFile(file, 1200, 1200, 0.8);
      onChange(compressedData, file.name);
      soundFx.playSuccess();
    } catch (err: any) {
      console.error('QR Image compression failed:', err);
      setErrorMessage('Failed to process image. Please try another file.');
      soundFx.playAlert();
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  // Clipboard Paste handler
  const handlePasteFromClipboard = async () => {
    soundFx.playClick();
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        // Fallback prompt
        setErrorMessage('Press Ctrl+V (or Cmd+V) directly on this page to paste your screenshot.');
        setTimeout(() => setErrorMessage(null), 4000);
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], `pasted_qr_${Date.now()}.png`, { type });
            await processFile(file);
            return;
          }
        }
      }
      setErrorMessage('No image found in your clipboard. Please copy a screenshot first.');
      setTimeout(() => setErrorMessage(null), 4000);
    } catch (err) {
      setErrorMessage('Unable to read clipboard directly. Press Ctrl+V (or Cmd+V) to paste.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  // Listen to window paste events
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Camera capture flow
  const startCamera = async () => {
    soundFx.playClick();
    setShowCameraModal(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. Please upload a file instead.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    soundFx.playClick();
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onChange(dataUrl, `camera_capture_${Date.now()}.jpg`);
      soundFx.playSuccess();
      stopCamera();
    }
  };

  // Download official payment QR
  const downloadOfficialQr = () => {
    soundFx.playClick();
    const intent = `upi://pay?pa=${upiId}&pn=IgniteX%202026%20Symposium&cu=INR${upiAmount ? `&am=${upiAmount}` : ''}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(intent)}&margin=10`;
    
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `IgniteX2026_Payment_QR_${upiAmount ? `₹${upiAmount}` : 'VPA'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 font-mono text-xs text-left">
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="text-emerald-400 font-bold flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-amber-400" />
          <span>{label}</span>
          {required && <span className="text-amber-400">*</span>}
        </label>

        {upiAmount && (
          <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
            PAYABLE: ₹{upiAmount}
          </span>
        )}
      </div>

      {/* Main Upload / Attachment Container */}
      {!value ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 bg-black/60 ${
            isDragging
              ? 'border-amber-400 bg-amber-950/20 scale-[1.01]'
              : 'border-emerald-700/80 hover:border-emerald-500'
          }`}
        >
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
            className="hidden"
          />

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
            <Upload className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <p className="font-bold text-white text-xs">
              Drag &amp; Drop QR / Payment Screenshot here
            </p>
            <p className="text-[10px] text-neutral-400 font-sans">
              Supports PNG, JPG, JPEG, WebP • Max 25MB (Auto-compressed)
            </p>
          </div>

          {/* Quick Action Button Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Browse File</span>
            </button>

            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="px-3.5 py-2 rounded-xl bg-[#081f10] border border-emerald-600 text-emerald-300 hover:bg-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Clipboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Paste Screenshot</span>
            </button>

            <button
              type="button"
              onClick={startCamera}
              className="px-3.5 py-2 rounded-xl bg-[#081f10] border border-emerald-600 text-emerald-300 hover:bg-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-teal-400" />
              <span>Capture Photo</span>
            </button>

            <button
              type="button"
              onClick={downloadOfficialQr}
              title="Download payment QR code image"
              className="px-3.5 py-2 rounded-xl bg-[#140e02] border border-amber-500/40 text-amber-300 hover:bg-amber-950 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save UPI QR</span>
            </button>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold pt-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Optimizing and compressing QR proof...</span>
            </div>
          )}
        </div>
      ) : (
        /* Attached QR / Screenshot Preview Card */
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#031408] to-[#020b04] border-2 border-emerald-500/60 shadow-[0_0_20px_rgba(0,255,102,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="relative group cursor-pointer" onClick={() => setShowPreviewModal(true)}>
              <img
                src={value}
                alt="Attached QR Screenshot"
                className="w-16 h-16 rounded-xl object-cover border border-emerald-400/60 shadow-md transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{fileName || 'payment_proof_qr.png'}</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
                ✓ QR Screenshot Verified &amp; Attached to Registration Record
              </p>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 mt-1 font-bold"
              >
                <Eye className="w-3 h-3" />
                <span>Click to View Full Size</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-[#081f10] border border-emerald-600 text-emerald-300 hover:bg-emerald-900 text-xs font-bold transition-all"
            >
              Replace
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClear();
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-300 hover:bg-rose-900 text-xs font-bold transition-all"
            >
              Remove
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
            className="hidden"
          />
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/80 flex items-center gap-2 text-xs text-rose-300 font-sans">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Full-Screen Preview Modal */}
      {showPreviewModal && value && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-2xl w-full max-h-[90vh] bg-[#020b04] border border-emerald-500 rounded-3xl p-6 space-y-4 text-left shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-emerald-900 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white uppercase text-sm">ATTACHED PAYMENT PROOF PREVIEW</span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-black rounded-2xl border border-emerald-950">
              <img
                src={value}
                alt="Full Payment Proof"
                className="max-h-[65vh] max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <span>{fileName || 'payment_proof.png'}</span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-lg w-full bg-[#020b04] border border-emerald-500 rounded-3xl p-6 space-y-4 text-center shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-900 pb-3 text-left">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white uppercase text-sm">SCAN / CAPTURE QR PROOF</span>
              </div>
              <button
                onClick={stopCamera}
                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-6 rounded-2xl bg-rose-950/60 border border-rose-700 text-rose-300 space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
                <p className="text-xs">{cameraError}</p>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs"
                >
                  Close &amp; Choose File Instead
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/60 aspect-[4/3] flex items-center justify-center shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder crosshairs */}
                  <div className="absolute inset-8 border-2 border-dashed border-amber-400/70 rounded-2xl pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] text-amber-300 bg-black/60 px-2 py-0.5 rounded font-mono font-bold">
                      Align QR or Receipt within Frame
                    </span>
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:scale-105 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>TAKE SNAPSHOT</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-3 rounded-2xl bg-neutral-900 text-neutral-300 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
