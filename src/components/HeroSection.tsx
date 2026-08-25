import React from 'react';
import { Shield, Sparkles, Trophy, Zap, MapPin, ArrowRight, Crown, Utensils, Bus, Building2, ChevronRight } from 'lucide-react';
import { DoomsdayClock } from './DoomsdayClock';
import { soundFx } from './AudioEffects';

interface HeroSectionProps {
  onExploreEvents: () => void;
  onOpenTicketPass: () => void;
  onOpenAdmin?: () => void;
  onOpenInfo?: () => void;
  onRegisterMultiple?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreEvents,
  onOpenTicketPass,
  onOpenAdmin,
  onOpenInfo,
  onRegisterMultiple,
}) => {
  return (
    <section className="relative pt-4 pb-12 sm:pt-6 sm:pb-16 overflow-hidden">
      {/* Background Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-emerald-500/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-amber-500/15 blur-[110px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">

        {/* ILLUMINATED HYPERLINK BANNER: FOOD • TRAVEL • ACCOMMODATION */}
        <div
          onClick={() => {
            soundFx.playClick();
            if (onOpenInfo) onOpenInfo();
          }}
          className="group cursor-pointer max-w-4xl mx-auto p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#0a2312]/95 to-emerald-950/90 border-2 border-emerald-400/90 shadow-[0_0_30px_rgba(0,255,102,0.4)] hover:shadow-[0_0_45px_rgba(234,179,8,0.6)] hover:border-amber-400 hover:scale-[1.01] transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400 border border-black"></span>
            </span>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-xs sm:text-sm font-mono font-black tracking-widest text-amber-300 group-hover:text-amber-200 transition-colors uppercase">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Utensils className="w-4 h-4 text-amber-400" />
                FOOD (MESS)
              </span>
              <span className="text-emerald-500">•</span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Bus className="w-4 h-4 text-amber-400" />
                COLLEGE BUS ROUTES
              </span>
              <span className="text-emerald-500">•</span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Building2 className="w-4 h-4 text-amber-400" />
                LOGISTICS
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black font-mono text-xs font-black group-hover:bg-amber-300 transition-colors shrink-0">
            <span>EXPLORE INFO MATRIX</span>
            <ChevronRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Hero Copy */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            {/* Warning Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-mono text-xs tracking-wider shadow-[0_0_15px_rgba(0,255,102,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>OFFICIAL BROADCAST // IGNITEX NATIONAL SYMPOSIUM</span>
            </div>

            {/* Giant Title */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase leading-[1.05]">
                IGNITEX <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-500 drop-shadow-[0_0_25px_rgba(34,197,94,0.6)]">
                  SYMPOSIUM
                </span>{' '}
                <span className="text-amber-400">2026</span>
              </h1>
              <p className="text-lg sm:text-2xl font-mono font-bold text-amber-300/90 tracking-wide uppercase flex items-center gap-2">
                <span>IGNITE YOUR POTENTIAL</span>
                <span className="text-emerald-400">•</span>
                <span className="text-emerald-400">NOV 14 - 15</span>
              </p>
            </div>

            {/* Description */}
            <p className="text-neutral-200 font-sans text-base sm:text-lg max-w-2xl leading-relaxed">
              Assemble at Sector Gate 1 for the supreme battle of technical mastery and IgniteX innovation. 
              Compete in <strong className="text-amber-400">9 high-stakes challenges</strong> across Technical & Non-Technical tracks 
              (Resume Building, Poster Making, Zero - The Final Key, Error Hunt, Neural Rush, Pitch Desk, Operation Bermuda, Prompt Perfect & Memergency) or grab the <strong className="text-emerald-400">₹400 3-Event Individual Pass</strong>!
            </p>

            {/* Venue & Organizer Tag */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-300">
              <div className="flex items-center gap-1.5 bg-[#05130a] border border-emerald-900 px-3 py-1.5 rounded-lg text-emerald-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Sector Arena // College Campus</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#05130a] border border-emerald-900 px-3 py-1.5 rounded-lg text-amber-400">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>2 Days of Quantum Innovation</span>
              </div>
            </div>

            {/* Call To Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  soundFx.playClick();
                  if (onRegisterMultiple) onRegisterMultiple();
                  else onExploreEvents();
                }}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black font-mono text-sm font-black shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Zap className="w-4 h-4 text-black" />
                <span>REGISTER MULTIPLE EVENTS</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onExploreEvents();
                }}
                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 text-black font-mono text-sm font-black shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-[1.02] transition-all"
              >
                <span>EXPLORE EVENTS</span>
              </button>
            </div>

          </div>

          {/* Right Column - Doomsday Clock & Live Stats Box */}
          <div className="lg:col-span-5 space-y-6">
            <DoomsdayClock targetDate="2026-09-09T08:30:00" />

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#040e07]/90 border border-emerald-900/80 text-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="font-mono text-lg font-bold text-amber-300">₹50,000</div>
                <div className="text-[10px] font-mono text-emerald-400/80">BOUNTY POOL</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#040e07]/90 border border-emerald-900/80 text-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="font-mono text-lg font-bold text-emerald-400">9 EVENTS</div>
                <div className="text-[10px] font-mono text-emerald-500/80">5 TECH / 4 NON-TECH</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#040e07]/90 border border-emerald-900/80 text-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="font-mono text-lg font-bold text-white">2 DAYS</div>
                <div className="text-[10px] font-mono text-emerald-400/80">SEPT 9 & 10</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

