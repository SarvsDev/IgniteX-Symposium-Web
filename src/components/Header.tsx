import React, { useState } from 'react';
import {
  Shield,
  User as UserIcon,
  Ticket,
  Lock,
  LogOut,
  Code2,
  Gamepad2,
  Info,
  Home,
  ChevronDown,
  Sparkles,
  Layers,
  UserPlus,
} from 'lucide-react';
import { User } from '../types';
import { soundFx } from './AudioEffects';

interface HeaderProps {
  user?: User | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenTicketPass: () => void;
  onOpenAdmin?: () => void;
  onOpenDetailsModal?: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  soundEnabled?: boolean;
  setSoundEnabled?: React.Dispatch<React.SetStateAction<boolean>>;
  onReopenGate?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onOpenTicketPass,
  onOpenAdmin,
  onOpenDetailsModal,
  activeSection,
  setActiveSection,
}) => {
  const [eventsDropdownOpen, setEventsDropdownOpen] = useState(false);

  const isEventsActive =
    activeSection === 'tech-events' ||
    activeSection === 'non-tech-events' ||
    activeSection === 'events';

  const handleNavClick = (sectionId: string) => {
    soundFx.playClick();
    setActiveSection(sectionId);
    setEventsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#030d06]/90 backdrop-blur-2xl border-b border-emerald-500/10 shadow-2xl transition-all">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-20 sm:h-24 flex items-center justify-between gap-4">
        
        {/* Logo & Branding - Sleek Dark Luxury */}
        <div
          className="flex items-center gap-3.5 cursor-pointer group shrink-0"
          onClick={() => handleNavClick('home')}
        >
          <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-950/80 via-[#06180c] to-[#020a04] border border-emerald-500/20 group-hover:border-amber-400/50 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.2)] transition-all">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 group-hover:text-amber-400 group-hover:scale-105 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg sm:text-xl font-bold tracking-wider text-white group-hover:text-emerald-300 transition-colors">
                IGNITEX <span className="text-amber-400">'26</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-400/20">
                2026
              </span>
            </div>
            <p className="text-[10px] font-mono text-emerald-400/80 tracking-widest uppercase">
              NATIONAL SYMPOSIUM
            </p>
          </div>
        </div>

        {/* Desktop Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-[#051409]/70 p-1.5 rounded-full border border-emerald-500/10 backdrop-blur-lg">
          {/* HOME */}
          <button
            onClick={() => handleNavClick('home')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold tracking-wider transition-all ${
              activeSection === 'home'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-neutral-300 hover:text-white hover:bg-emerald-950/50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>HOME</span>
          </button>

          {/* INFO */}
          <button
            onClick={() => handleNavClick('protocol')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold tracking-wider transition-all ${
              activeSection === 'protocol'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-neutral-300 hover:text-white hover:bg-emerald-950/50'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>INFO</span>
          </button>

          {/* REGISTER (MULTI-EVENT REGISTRATION) */}
          <button
            onClick={() => handleNavClick('register')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold tracking-wider transition-all ${
              activeSection === 'register'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/30'
                : 'text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 border border-amber-400/20'
            }`}
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>REGISTER</span>
          </button>

          {/* UNIFIED EVENTS LINK (WITH TECH & NON-TECH DROPDOWN) */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick();
                setEventsDropdownOpen(!eventsDropdownOpen);
                if (!isEventsActive) {
                  setActiveSection('tech-events');
                }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold tracking-wider transition-all ${
                isEventsActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-neutral-300 hover:text-white hover:bg-emerald-950/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>EVENTS</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${eventsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {eventsDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-[#041208]/95 border border-emerald-500/20 shadow-2xl backdrop-blur-xl p-2 z-50 animate-fadeIn space-y-1">
                <button
                  onClick={() => handleNavClick('tech-events')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-bold transition-all text-left ${
                    activeSection === 'tech-events'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-neutral-300 hover:bg-emerald-950/60 hover:text-white'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-bold">TECHNICAL EVENTS</div>
                    <div className="text-[10px] text-neutral-400">Coding, AI, Web3 & Hackathons</div>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('non-tech-events')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-bold transition-all text-left ${
                    activeSection === 'non-tech-events'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-neutral-300 hover:bg-emerald-950/60 hover:text-white'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold">NON-TECHNICAL EVENTS</div>
                    <div className="text-[10px] text-neutral-400">Gaming, Quiz, Design & Media</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Streamlined Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around bg-[#020a04] border-t border-emerald-900/40 py-2 px-3 gap-1">
        <button
          onClick={() => handleNavClick('home')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeSection === 'home'
              ? 'bg-emerald-500 text-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>HOME</span>
        </button>

        <button
          onClick={() => handleNavClick('protocol')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeSection === 'protocol'
              ? 'bg-emerald-500 text-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>INFO</span>
        </button>

        <button
          onClick={() => handleNavClick('register')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeSection === 'register'
              ? 'bg-amber-400 text-black shadow-sm'
              : 'text-amber-300 hover:text-amber-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>REGISTER</span>
        </button>

        <button
          onClick={() => handleNavClick('tech-events')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeSection === 'tech-events'
              ? 'bg-emerald-500 text-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>TECH</span>
        </button>

        <button
          onClick={() => handleNavClick('non-tech-events')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeSection === 'non-tech-events'
              ? 'bg-amber-500 text-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>NON-TECH</span>
        </button>
      </div>
    </header>
  );
};


