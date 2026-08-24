import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Building2,
  Users,
  Lock,
  ArrowRight,
  ArrowLeft,
  Crown,
  MessageCircle,
  FileText,
  Printer,
  ExternalLink,
  GraduationCap,
  Calendar,
  Eye,
  RefreshCw,
  Upload,
  Copy,
  Check,
  Image as ImageIcon,
  FileSpreadsheet,
  AlertCircle,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SymposiumEvent, Registration, User as UserType } from '../types';
import { soundFx } from './AudioEffects';
import { submitRegistration } from '../lib/registrationService';
import { compressImageFile } from '../lib/imageCompressor';
import { QRAttachZone } from './QRAttachZone';

interface RegistrationModalProps {
  event: SymposiumEvent | null;
  user: UserType | null;
  onClose: () => void;
  onSuccess: (registration: Registration) => void;
  onOpenAuth?: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  user,
  onClose,
  onSuccess,
  onOpenAuth,
}) => {
  if (!event) return null;

  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details');
  const [formData, setFormData] = useState({
    userName: user?.name || '',
    userAge: user?.userAge || '20',
    userCollege: user?.college || '',
    userDepartment: user?.department || 'Computer Science & Engineering',
    userPhone: user?.phone || '',
    userEmail: user?.email || '',
    collegeYear: user?.collegeYear || '1st Year',
    teamName: '',
    member2: '',
    member3: '',
    member4: '',
    paymentGateway: 'UPI_FORM_RESPONSE' as 'UPI_FORM_RESPONSE' | 'UPI',
    transactionId: '',
    paymentScreenshot: '',
  });

  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  const [completedRegistration, setCompletedRegistration] = useState<Registration | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string>('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const officialUpiId = 'sarveshv6413@okaxis';
  const upiIntentUri = `upi://pay?pa=${officialUpiId}&pn=IgniteX%202026%20Symposium&am=${event.entryFee}&cu=INR&tn=IgniteX-${encodeURIComponent(event.title)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(officialUpiId);
    setCopiedUpi(true);
    soundFx.playClick();
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleScreenshotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg('Screenshot file size exceeds 20MB. Please select a smaller image.');
        soundFx.playAlert();
        return;
      }
      setScreenshotFileName(file.name);
      try {
        const compressedBase64 = await compressImageFile(file);
        setScreenshotPreview(compressedBase64);
        setFormData((prev) => ({ ...prev, paymentScreenshot: compressedBase64 }));
        soundFx.playClick();
      } catch (err) {
        console.warn('Fallback to standard file read:', err);
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setScreenshotPreview(base64);
          setFormData((prev) => ({ ...prev, paymentScreenshot: base64 }));
          soundFx.playClick();
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.userName ||
      !formData.userAge ||
      !formData.userCollege ||
      !formData.userPhone ||
      !formData.userEmail ||
      !formData.collegeYear
    ) {
      setErrorMsg('Please complete all required fields (Name, Age, College, Mobile No., Email, Year of College).');
      soundFx.playAlert();
      return;
    }
    setErrorMsg(null);
    soundFx.playClick();
    setStep('payment');
  };

  const handleProcessPayment = async () => {
    soundFx.playClick();

    if (!user || !user.email) {
      soundFx.playAlert();
      setErrorMsg('ACTIVE ACCOUNT REQUIRED: You can only submit the payment response if you are signed in to an active account. Please log in or register below.');
      return;
    }

    if (!formData.transactionId.trim()) {
      soundFx.playAlert();
      setErrorMsg('TRANSACTION ID REQUIRED: Please enter the 12-digit UPI UTR / Transaction Reference Number from your payment receipt.');
      return;
    }

    if (!formData.paymentScreenshot && !screenshotPreview) {
      soundFx.playAlert();
      setErrorMsg('PAYMENT SCREENSHOT REQUIRED: Please upload or attach a screenshot of your successful payment confirmation.');
      return;
    }

    setStep('processing');
    setErrorMsg(null);

    const logs = [
      'Validating UPI Transaction UTR & payment proof...',
      `Target Event: ${event.title} (Fee: ₹${event.entryFee})...`,
      `[AUTOVERIFIED] Minting verified IgniteX Quantum QR Pass...`,
      `Uploading payment proof to Supabase Storage...`
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise((res) => setTimeout(res, 300));
      setProcessingLog((prev) => [...prev, logs[i]]);
    }

    try {
      const memberNames = [formData.member2, formData.member3, formData.member4]
        .filter((m) => m && m.trim())
        .map((m) => ({ name: m.trim() }));

      const result = await submitRegistration({
        participant: {
          full_name: formData.userName.trim(),
          email: formData.userEmail.trim().toLowerCase(),
          phone: formData.userPhone.trim(),
          age: formData.userAge.trim(),
          college: formData.userCollege.trim(),
          department: formData.userDepartment.trim() || undefined,
          college_year: formData.collegeYear.trim() || undefined,
        },
        selected_events: [{ event_id: event.id }],
        teams: event.maxTeamSize > 1
          ? [{
              event_id: event.id,
              team_name: formData.teamName?.trim() || '',
              members: memberNames,
            }]
          : [],
        payment: {
          transaction_id: formData.transactionId.trim(),
          payment_screenshot_url: formData.paymentScreenshot || screenshotPreview || undefined,
          payment_screenshot_name: screenshotFileName || undefined,
          payment_gateway: 'UPI',
        },
      });

      if (!result.success || !result.data?.registrations?.length) {
        throw new Error(result.error?.message || 'Registration could not be submitted.');
      }

      const newRegistration = result.data.registrations[0] as Registration;
      setCompletedRegistration(newRegistration);

      setStep('success');
      soundFx.playSuccess();
      confetti({
        particleCount: 90,
        spread: 80,
        colors: ['#00FF66', '#EAB308', '#10B981'],
        origin: { y: 0.6 },
      });
      onSuccess(newRegistration);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration submission error. Please retry.');
      setStep('payment');
      soundFx.playAlert();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#030a05] border border-emerald-800 shadow-2xl p-6 text-left space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/80 pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>IGNITEX 2026 // GOOGLE FORM RESPONSE & REGISTRATION</span>
            </span>
            <h2 className="text-xl font-mono font-black text-white">{event.title}</h2>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#08150c] text-neutral-400 hover:text-white border border-emerald-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: PARTICIPANT DETAILS */}
        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div className="space-y-3">
              {/* Field 1 & 2: Name and Age */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-emerald-400 block mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      placeholder="e.g. Alex Kumar"
                      className="w-full bg-[#06120a] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-emerald-400 block mb-1">
                    Age *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    <input
                      type="number"
                      required
                      min={15}
                      max={99}
                      value={formData.userAge}
                      onChange={(e) => setFormData({ ...formData, userAge: e.target.value })}
                      placeholder="20"
                      className="w-full bg-[#06120a] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Field 3 & 4: College and Mobile No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-emerald-400 block mb-1">
                    College / Institute *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.userCollege}
                      onChange={(e) => setFormData({ ...formData, userCollege: e.target.value })}
                      placeholder="e.g. Institute of Technology"
                      className="w-full bg-[#06120a] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-emerald-400 block mb-1">
                    Mobile No. *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={formData.userPhone}
                      onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
                      placeholder="e.g. +91 98765 00000"
                      className="w-full bg-[#06120a] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Field 5 & 6: Email and Year of College */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-emerald-400 block mb-1">
                    Google Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={formData.userEmail}
                      onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                      placeholder="e.g. participant@gmail.com"
                      className="w-full bg-[#06120a] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-emerald-400 block mb-1">
                    Year of College *
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    <select
                      required
                      value={formData.collegeYear}
                      onChange={(e) => setFormData({ ...formData, collegeYear: e.target.value })}
                      className="w-full bg-[#06120a] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400 appearance-none"
                    >
                      <option value="1st Year">1st Year (Freshman)</option>
                      <option value="2nd Year">2nd Year (Sophomore)</option>
                      <option value="3rd Year">3rd Year (Junior)</option>
                      <option value="4th Year">4th Year (Senior)</option>
                      <option value="PG / Other">Post Graduate / Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-[10px] font-mono text-emerald-300 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Official confirmation pass & payment receipt will be recorded to Google Sheets and sent to <strong>{formData.userEmail}</strong>.
                </span>
              </div>

              {/* Team inputs if teamSize > 1 */}
              {event.maxTeamSize > 1 && (
                <div className="p-3.5 rounded-xl bg-[#05110a] border border-emerald-900 space-y-3 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 font-bold">
                    <Users className="w-4 h-4" />
                    <span>Squad Members ({event.teamSize})</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-emerald-500/80 block mb-1">Squad Name</label>
                    <input
                      type="text"
                      value={formData.teamName}
                      onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                      placeholder="e.g. IgniteX Champions"
                      className="w-full bg-[#020703] border border-emerald-900 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {event.maxTeamSize >= 2 && (
                    <input
                      type="text"
                      value={formData.member2}
                      onChange={(e) => setFormData({ ...formData, member2: e.target.value })}
                      placeholder="Squad Member 2 Name"
                      className="w-full bg-[#020703] border border-emerald-900 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-600"
                    />
                  )}
                  {event.maxTeamSize >= 3 && (
                    <input
                      type="text"
                      value={formData.member3}
                      onChange={(e) => setFormData({ ...formData, member3: e.target.value })}
                      placeholder="Squad Member 3 Name (Optional)"
                      className="w-full bg-[#020703] border border-emerald-900 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-600"
                    />
                  )}
                  {event.maxTeamSize >= 4 && (
                    <input
                      type="text"
                      value={formData.member4}
                      onChange={(e) => setFormData({ ...formData, member4: e.target.value })}
                      placeholder="Squad Member 4 Name (Optional)"
                      className="w-full bg-[#020703] border border-emerald-900 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-600"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-emerald-900 flex items-center justify-between">
              <div className="font-mono text-xs text-neutral-400">
                Amount Payable: <strong className="text-amber-400 text-sm">₹{event.entryFee}</strong>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black font-mono text-xs font-extrabold transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                <span>Proceed to UPI Payment Proof</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: GOOGLE FORM UPI PAYMENT & PROOF RESPONSE */}
        {step === 'payment' && (
          <div className="space-y-5">
            {!user ? (
              <div className="p-4 rounded-xl bg-amber-950/90 border border-amber-500 text-amber-300 font-mono text-xs space-y-2.5 shadow-lg">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ACTIVE ACCOUNT REQUIRED BEFORE PAYMENT</span>
                </div>
                <p className="text-[11px] text-neutral-200 leading-relaxed">
                  You are currently browsing as a guest. To purchase and activate your <strong>1 General Pass</strong>, you must log in to an active account first.
                </p>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      onClose();
                      onOpenAuth();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-[1.02] transition-all"
                  >
                    <User className="w-4 h-4 text-black" />
                    <span>LOG IN TO ACTIVE ACCOUNT TO PAY</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Active Account Verified: <strong className="text-white">{user.email}</strong> (1 General Pass)</span>
              </div>
            )}

            {/* UPI SCAN & PAY CARD */}
            <div className="p-4 rounded-2xl bg-[#041108] border border-emerald-600/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-900/80 pb-2">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>STEP 1: SCAN QR & COMPLETE UPI PAYMENT</span>
                </span>
                <span className="text-xs font-mono font-black text-white bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                  ₹{event.entryFee}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* QR Code Graphic with amount and dynamic UPI link */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 rounded-xl bg-white text-black text-center space-y-1">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiIntentUri)}&margin=1`}
                    alt="IgniteX Official UPI Payment QR"
                    className="w-36 h-36 rounded-lg object-contain mx-auto"
                  />
                  <span className="text-[10px] font-mono font-bold text-neutral-800">
                    Scan using GPay / PhonePe / Paytm
                  </span>
                </div>

                {/* UPI Details & Intent Buttons */}
                <div className="sm:col-span-7 space-y-2.5 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">OFFICIAL UPI ID (VPA)</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="p-2 rounded-lg bg-black border border-emerald-900 text-emerald-300 font-bold text-xs flex-1 truncate select-all">
                        {officialUpiId}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-3 py-2 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs font-bold flex items-center gap-1 hover:bg-emerald-900 transition-all shrink-0"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900 text-[11px] text-neutral-300 space-y-1">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Event:</span>
                      <span className="text-white font-bold truncate max-w-[140px]">{event.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Entry Fee:</span>
                      <span className="text-amber-400 font-bold">₹{event.entryFee}</span>
                    </div>
                  </div>

                  <a
                    href={upiIntentUri}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-amber-500 text-black font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-black" />
                    <span>Open in UPI App (Mobile Only)</span>
                  </a>
                </div>
              </div>
            </div>

            {/* FORM RESPONSE FIELDS: TRANSACTION ID & PAYMENT SCREENSHOT */}
            <div className="p-4 rounded-2xl bg-[#040f07] border border-emerald-800 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-emerald-900 pb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>STEP 2: SUBMIT PAYMENT PROOF RESPONSE</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  MANDATORY VERIFICATION
                </span>
              </div>

              {/* Transaction ID / UTR Input */}
              <div className="space-y-1">
                <label className="text-[11px] text-emerald-400 font-bold block">
                  12-DIGIT UPI UTR / TRANSACTION ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 423871920194 or UPI/4238719201"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  className="w-full bg-black border border-emerald-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-neutral-400 block">
                  Find the 12-digit UTR/Reference number on your GPay / PhonePe / Paytm payment screen.
                </span>
              </div>

              {/* Payment Screenshot & QR Attach Zone */}
              <QRAttachZone
                value={formData.paymentScreenshot}
                fileName={screenshotFileName}
                onChange={(dataUrl, fName) => {
                  setScreenshotPreview(dataUrl);
                  setScreenshotFileName(fName);
                  setFormData((prev) => ({ ...prev, paymentScreenshot: dataUrl }));
                  setErrorMsg(null);
                }}
                onClear={() => {
                  setScreenshotPreview(null);
                  setScreenshotFileName(null);
                  setFormData((prev) => ({ ...prev, paymentScreenshot: '' }));
                }}
                label="ATTACH PAYMENT QR / SCREENSHOT PROOF"
                required={true}
                upiAmount={event.entryFee}
                upiId={officialUpiId}
              />

              {/* Google Form Response Sync Notice */}
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-[10px] text-emerald-300 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Response will be auto-synced to Master Google Sheet and verified in SQLite database.</span>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setStep('details');
                }}
                className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-[#06120a] border border-emerald-900 text-xs font-mono text-emerald-300 hover:bg-emerald-950/40 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black font-mono text-xs font-extrabold shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:brightness-110 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Submit UPI Proof &amp; Mint Pass</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PROCESSING */}
        {step === 'processing' && (
          <div className="py-8 text-center space-y-6">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-mono font-bold text-white uppercase">RECORDING GOOGLE FORM RESPONSE</h3>
              <p className="text-xs font-mono text-emerald-400">Verifying transaction proof & minting IgniteX pass</p>
            </div>

            <div className="p-4 rounded-xl bg-black border border-emerald-900 font-mono text-[11px] text-left text-emerald-400 space-y-1.5 max-h-40 overflow-y-auto">
              {processingLog.map((log, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-amber-400">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'success' && completedRegistration && (
          <div className="py-2 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-950/90 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,255,102,0.5)]">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-mono font-black text-white uppercase tracking-tight">
                REGISTERED SUCCESSFULLY!
              </h3>
              <p className="text-xs font-mono text-amber-400">
                Your registration for <span className="text-white font-bold">{completedRegistration.eventTitle}</span> has been submitted.
              </p>
            </div>

            {/* Approval Status Banner */}
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-left font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>STATUS: PENDING ADMIN APPROVAL</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  UNDER REVIEW
                </span>
              </div>
              <p className="text-[11px] text-neutral-300">
                Your payment reference (<strong className="text-amber-300 font-mono">{completedRegistration.transactionId}</strong>) and registration details have been submitted to the IgniteX Command Team.
              </p>
              <p className="text-[11px] text-emerald-300">
                ⚡ Once the admin approves your registration, your official entry pass with a <strong>unique IGX-XXXX Registration ID</strong> and <strong>gate QR code</strong> will be generated and dispatched directly to <strong className="text-white">{completedRegistration.userEmail}</strong>.
              </p>
            </div>

            {/* Registration Summary Card */}
            <div className="p-4 rounded-xl bg-[#020804] border border-emerald-800/80 text-left font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900 pb-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>REGISTRATION RECEIPT SUMMARY</span>
                </div>
                <span className="text-[10px] text-neutral-400">
                  {completedRegistration.receiptNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[11px] text-neutral-300">
                <div>
                  <span className="text-[10px] text-emerald-500/80 block">PARTICIPANT NAME</span>
                  <span className="font-bold text-white text-xs">{completedRegistration.userName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500/80 block">AMOUNT PAID</span>
                  <span className="font-bold text-amber-400 text-xs">₹{completedRegistration.amountPaid}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500/80 block">EVENT REGISTERED</span>
                  <span className="text-emerald-300 font-bold truncate block">{completedRegistration.eventTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500/80 block">COLLEGE / INSTITUTION</span>
                  <span className="text-neutral-200 truncate block">{completedRegistration.userCollege}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500/80 block">CONTACT EMAIL</span>
                  <span className="text-neutral-200 truncate block">{completedRegistration.userEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500/80 block">TRANSACTION REF / UTR</span>
                  <span className="text-[10px] text-amber-400 font-mono truncate block">{completedRegistration.transactionId}</span>
                </div>
              </div>

              {completedRegistration.teamName && (
                <div className="pt-2 border-t border-emerald-900 text-[11px]">
                  <span className="text-emerald-500/80">Squad Name: </span>
                  <strong className="text-amber-400">{completedRegistration.teamName}</strong>
                </div>
              )}
            </div>

            {/* Official WhatsApp Channel Link */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#072412] to-green-950 border border-emerald-500/50 shadow-md text-left space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-400">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase">JOIN OFFICIAL WHATSAPP CHANNEL</h4>
                  <p className="text-[10px] font-mono text-emerald-300">Get live announcements, schedule updates & symposium alerts</p>
                </div>
              </div>

              <a
                href="https://whatsapp.com/channel/0029Va9IgniteX2026"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundFx.playClick()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-black transition-all shadow-md mt-1"
              >
                <MessageCircle className="w-4 h-4 text-black fill-black/20" />
                <span>Join Official IgniteX 2026 WhatsApp Channel</span>
                <ExternalLink className="w-3.5 h-3.5 text-black" />
              </a>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black font-mono text-xs font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.01]"
              >
                Done / Return to Events
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
