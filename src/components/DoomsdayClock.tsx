import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, Zap, Crown } from 'lucide-react';

interface DoomsdayClockProps {
  targetDate?: string; // e.g. "2026-09-09T08:30:00"
}

export const DoomsdayClock: React.FC<DoomsdayClockProps> = ({
  targetDate = '2026-09-09T08:30:00',
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#030a05]/90 border border-emerald-500/50 p-4 sm:p-6 backdrop-blur-md shadow-[0_0_35px_rgba(16,185,129,0.25)]">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-emerald-900/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]">
            IGNITEX PROTOCOL // LAUNCH TIMER
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(234,179,8,0.2)]">
          <Crown className="w-3 h-3 text-amber-400" />
          <span>DEFCON 1</span>
        </div>
      </div>

      {/* Countdown Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
        {[
          { label: 'DAYS', value: timeLeft.days },
          { label: 'HOURS', value: timeLeft.hours },
          { label: 'MINUTES', value: timeLeft.minutes },
          { label: 'SECONDS', value: timeLeft.seconds },
        ].map((unit, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-xl bg-[#020603] border border-emerald-900/80 shadow-inner group hover:border-amber-400/80 transition-all"
          >
            <div className="font-mono text-2xl sm:text-4xl font-extrabold text-amber-400 tracking-wider drop-shadow-[0_0_12px_rgba(234,179,8,0.6)]">
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs font-mono text-emerald-400/80 tracking-widest uppercase mt-1">
              {unit.label}
            </div>
          </div>
        ))}
      </div>

      {/* Subtext info */}
      <div className="mt-4 pt-3 border-t border-emerald-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 font-mono gap-2">
        <div className="flex items-center gap-1.5 text-neutral-300">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Launch: Sept 9, 2026 @ 08:30 IST</span>
        </div>
        <div className="text-[11px] text-amber-400/90 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>QUANTUM FIELD ENERGIZED</span>
        </div>
      </div>
    </div>
  );
};
