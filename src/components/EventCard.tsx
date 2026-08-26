import React from 'react';
import {
  ShieldAlert,
  Cpu,
  Terminal,
  Bot,
  Zap,
  Lock,
  Gamepad2,
  Coins,
  Film,
  Users,
  MapPin,
  Trophy,
  ArrowUpRight,
  Sparkles,
  FileText,
  Image,
  Key,
  Palette,
  KeyRound,
  Bug,
  Briefcase,
  Compass,
  Flame,
  MessageSquare,
  Ticket,
  Layers,
  Presentation,
  Radar,
  Code2,
} from 'lucide-react';
import { SymposiumEvent } from '../types';
import { soundFx } from './AudioEffects';

interface EventCardProps {
  event: SymposiumEvent;
  onSelectEvent: (event: SymposiumEvent) => void;
  onQuickRegister: (event: SymposiumEvent) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  ShieldAlert,
  Cpu,
  Terminal,
  Bot,
  Zap,
  Lock,
  Gamepad2,
  Coins,
  Film,
  FileText,
  Image,
  Key,
  Palette,
  KeyRound,
  Bug,
  Briefcase,
  Compass,
  Flame,
  MessageSquare,
  Ticket,
  Layers,
  Presentation,
  Radar,
  Code2,
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelectEvent,
  onQuickRegister,
}) => {
  const IconComponent = ICON_MAP[event.iconName] || Sparkles;
  const isTech = event.category === 'technical';

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-[#040d07]/90 border border-emerald-900/80 hover:border-emerald-400 p-5 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,102,0.25)] overflow-hidden">
      {/* Background hazard green/gold subtle gradient accent */}
      <div
        className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-opacity opacity-25 group-hover:opacity-50 ${
          isTech ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
      />

      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase border ${
                isTech
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                  : 'bg-amber-950/90 text-amber-300 border-amber-700'
              }`}
            >
              {event.category}
            </span>
            <span className="px-2 py-1 rounded-md text-[11px] font-mono text-neutral-300 bg-[#020703] border border-emerald-950">
              {event.day}
            </span>
          </div>

          <div className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-600/30">
            <Trophy className="w-3.5 h-3.5" />
            <span>{event.prizePool}</span>
          </div>
        </div>

        {/* Title & Icon */}
        <div className="flex items-start gap-3 my-2">
          <div
            className={`p-2.5 rounded-xl border flex-shrink-0 ${
              isTech
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                : 'bg-amber-950/60 border-amber-700/60 text-amber-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
            }`}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-mono text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
              {event.title}
            </h3>
            <p className="text-xs font-sans text-neutral-300 line-clamp-2 mt-0.5 leading-relaxed">
              {event.tagline}
            </p>
          </div>
        </div>

        {/* Metadata info — event timing intentionally hidden */}
        <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-emerald-950/80 text-xs font-mono text-neutral-300">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <span className="text-emerald-400">📅</span>
            <span className="truncate">{event.day}</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{event.teamSize}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <span>Entry: ₹{event.entryFee}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-3 border-t border-emerald-950/80 flex items-center gap-2">
        <button
          onClick={() => {
            soundFx.playClick();
            onSelectEvent(event);
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-[#020804] hover:bg-emerald-950/80 border border-emerald-900 text-xs font-mono text-emerald-300 hover:text-white transition-all text-center"
        >
          View Rules
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onQuickRegister(event);
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 hover:brightness-110 text-black font-mono text-xs font-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_22px_rgba(0,255,102,0.6)] flex items-center justify-center gap-1"
        >
          <span>Register</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-black" />
        </button>
      </div>
    </div>
  );
};
