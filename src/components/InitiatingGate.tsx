import React, { useState, useEffect } from 'react';
import { Shield, Crown, Sparkles } from 'lucide-react';
import { soundFx } from './AudioEffects';

interface InitiatingGateProps {
  onEnter: () => void;
}

export const InitiatingGate: React.FC<InitiatingGateProps> = ({ onEnter }) => {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('ESTABLISHING IGNITEX QUANTUM TUNNEL...');
  const [isWarping, setIsWarping] = useState(false);

  useEffect(() => {
    // Automatic interaction-free progress increment from 0 to 100 in exactly 1.5s
    const totalDuration = 1500; // 1.5 seconds fast load
    const intervalTime = 20;
    const steps = totalDuration / intervalTime;
    let currentStep = 0;

    const messages = [
      { threshold: 0, msg: 'ESTABLISHING IGNITEX QUANTUM TUNNEL...' },
      { threshold: 25, msg: 'LOADING SYMPOSIUM EVENT MATRIX...' },
      { threshold: 50, msg: 'DECRYPTING 9 IGNITEX SECTOR BLUEPRINTS...' },
      { threshold: 75, msg: 'SYNCHRONIZING PARTICIPANT PASSES...' },
      { threshold: 95, msg: 'INITIATION COMPLETE. ENTERING IGNITEX...' },
    ];

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(100, Math.floor((currentStep / steps) * 100));
      setProgress(currentProgress);

      // Update status message
      for (let i = messages.length - 1; i >= 0; i--) {
        if (currentProgress >= messages[i].threshold) {
          setStatusMessage(messages[i].msg);
          break;
        }
      }

      if (currentStep >= steps) {
        clearInterval(timer);
        soundFx.playSuccess();
        setIsWarping(true);
        // Automatically enter without any manual click
        setTimeout(() => {
          onEnter();
        }, 500);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onEnter]);

  // SVG Radial circle geometry
  const radius = 64;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020603] text-white font-mono p-4 overflow-hidden transition-all duration-700 select-none ${
        isWarping ? 'scale-125 opacity-0 blur-lg pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dark Ambient Grid & Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,102,0.15)_0%,rgba(0,0,0,0.95)_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff6608_1px,transparent_1px),linear-gradient(to_bottom,#00ff6608_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Latveria Map / Sovereign Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full border border-emerald-500/30 animate-spin-slow flex items-center justify-center">
          <div className="w-[450px] h-[450px] rounded-full border border-dashed border-amber-500/30" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-8 text-center max-w-md w-full">
        
        {/* Top Crest */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.2)]">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>IGNITEX 2026</span>
        </div>

        {/* RADIAL PROGRESS ELEMENT */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          
          {/* Rotating Outer Tech Ring */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-spin-slow" />
          <div className="absolute inset-2 rounded-full border border-dashed border-amber-500/20 animate-reverse-spin" />

          {/* SVG Radial Progress Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="radialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FF66" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#EAB308" />
              </linearGradient>
            </defs>

            {/* Background Track Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(6, 30, 15, 0.8)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Animated Active Progress Arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#radialGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-75 ease-linear filter drop-shadow-[0_0_12px_rgba(0,255,102,0.8)]"
            />
          </svg>

          {/* Center Emblem / Doctor Doom Badge inside Radial Ring */}
          <div className="absolute inset-6 rounded-full bg-[#030d06] border border-emerald-500/40 flex flex-col items-center justify-center p-3 shadow-[0_0_35px_rgba(0,255,102,0.2)]">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/60 shadow-[0_0_20px_rgba(0,255,102,0.4)] mb-1">
              <Shield className="w-8 h-8 text-emerald-400 animate-pulse" />
              <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1" />
            </div>

            <span className="text-[10px] font-mono font-black tracking-widest text-emerald-400 uppercase">
              IGNITEX
            </span>
          </div>

        </div>

        {/* STATUS & PERCENTAGE TEXT */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase text-white drop-shadow-[0_0_15px_rgba(0,255,102,0.4)]">
            INITIATING SYMPOSIUM...
          </h2>

          <div className="text-3xl font-black text-amber-400 tracking-wider drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]">
            {progress}%
          </div>

          <p className="text-[11px] font-mono text-emerald-400/80 tracking-wider h-6 animate-pulse uppercase">
            {statusMessage}
          </p>
        </div>

        {/* Bottom Subtext */}
        <div className="text-[10px] text-emerald-600/70 uppercase tracking-widest pt-4 border-t border-emerald-950/80 w-full">
          AUTOMATIC QUANTUM GATEWAY • SATHYABAMA INSTITUTE
        </div>

      </div>
    </div>
  );
};
