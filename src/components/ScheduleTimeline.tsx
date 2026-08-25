import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Trophy,
  Crown,
  ArrowRight,
  Sparkles,
  Code2,
  Gamepad2,
  Cpu,
  Shield,
  Zap,
} from 'lucide-react';
import { SymposiumEvent } from '../types';
import { soundFx } from './AudioEffects';

interface ScheduleTimelineProps {
  events: SymposiumEvent[];
  onSelectEvent: (event: SymposiumEvent) => void;
  onRegisterEvent?: (event: SymposiumEvent) => void;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  events,
  onSelectEvent,
  onRegisterEvent,
}) => {
  const [selectedDay, setSelectedDay] = useState<'Day 1' | 'Day 2'>('Day 1');
  const [viewMode, setViewMode] = useState<'ignitex' | 'list'>('ignitex');

  const dayEvents = events.filter((e) => e.day === selectedDay);

  return (
    <div className="space-y-10">
      
      {/* Header Controls: Day Selector Tabs & IgniteX View Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#040e07]/80 p-3 rounded-2xl border border-emerald-900/80">
        
        {/* Day Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          {['Day 1', 'Day 2'].map((day) => {
            const active = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedDay(day as any);
                }}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black shadow-[0_0_20px_rgba(0,255,102,0.4)]'
                    : 'bg-[#020703] border border-emerald-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{day === 'Day 1' ? 'SEPT 9 (DAY 1)' : 'SEPT 10 (DAY 2)'}</span>
                {active && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}

        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#020703] p-1 rounded-xl border border-emerald-900 font-mono text-[11px]">
          <button
            onClick={() => {
              soundFx.playClick();
              setViewMode('ignitex');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'ignitex'
                ? 'bg-emerald-950 text-amber-300 font-bold border border-amber-500/50'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>IgniteX Pathway</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setViewMode('list');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-600'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Event List</span>
          </button>
        </div>

      </div>

      {/* MODE 1: IGNITEX SINE-WAVE PATHWAY */}
      {viewMode === 'ignitex' && (
        <div className="space-y-12 animate-fadeIn">
          
          {/* IgniteX Banner Header */}
          <div className="text-center space-y-1">
            <h3 className="text-2xl sm:text-3xl font-mono font-black tracking-widest uppercase text-white drop-shadow-[0_0_20px_rgba(0,255,102,0.3)]">
              THE IGNITEX PATHWAY
            </h3>
            <p className="text-[11px] font-mono text-emerald-400 tracking-wider uppercase">
              [ CHARTING COURSES & LOCKING VECTOR POINTS ]
            </p>
          </div>

          {/* DESKTOP / TABLET CURVED SINE WAVE TIMELINE */}
          <div className="hidden md:block relative pt-44 pb-44 px-12 lg:px-16 overflow-x-auto min-w-[980px] rounded-3xl bg-[#020b05]/80 border border-emerald-900/70 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
            
            {/* SVG Glowing Sine Wave Curve */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center px-12 lg:px-16">
              <svg
                viewBox="0 0 1000 240"
                className="w-full h-auto overflow-visible"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00FF66" />
                    <stop offset="50%" stopColor="#EAB308" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                  <filter id="glowWave" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Base Background Wave */}
                <path
                  d="M 60 120 Q 210 20 360 120 T 660 120 T 940 120"
                  stroke="rgba(16, 185, 129, 0.25)"
                  strokeWidth="5"
                  fill="none"
                />

                {/* Glowing Laser Sine Curve */}
                <path
                  d="M 60 120 Q 210 20 360 120 T 660 120 T 940 120"
                  stroke="url(#waveGrad)"
                  strokeWidth="3.5"
                  fill="none"
                  filter="url(#glowWave)"
                  className="animate-pulse"
                />
              </svg>
            </div>

            {/* Event Nodes Along the Wave */}
            <div className="relative z-10 grid grid-cols-5 gap-6 items-center">
              {dayEvents.slice(0, 5).map((event, idx) => {
                const nodeNumber = String(idx + 1).padStart(2, '0');
                const isEven = idx % 2 === 0; // Alternates Top / Bottom
                const isTech = event.category === 'technical';

                // Nudge position for end nodes to avoid screen edge overflow
                let alignOffset = 'left-1/2 -translate-x-1/2';
                if (idx === 0) alignOffset = 'left-0 sm:left-1/2 sm:-translate-x-1/3';
                if (idx === 4) alignOffset = 'right-0 sm:right-auto sm:left-1/2 sm:-translate-x-2/3';

                return (
                  <div
                    key={event.id}
                    className={`flex flex-col items-center relative group ${
                      isEven ? 'mb-16' : 'mt-16'
                    }`}
                  >
                    {/* Event Details Card (Sized comfortably to 280px with clean spacing) */}
                    <div
                      className={`absolute ${
                        isEven ? 'bottom-16' : 'top-16'
                      } ${alignOffset} w-[275px] sm:w-[290px] p-4 rounded-2xl bg-[#030f07]/95 border border-emerald-800/80 group-hover:border-amber-400 group-hover:shadow-[0_0_30px_rgba(0,255,102,0.35)] transition-all z-20 text-left shadow-2xl backdrop-blur-md`}
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] mb-2 gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isTech ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {event.category}
                        </span>
                      </div>

                      <h4
                        onClick={() => {
                          soundFx.playClick();
                          onSelectEvent(event);
                        }}
                        className="font-mono text-sm font-black text-white group-hover:text-amber-300 transition-colors cursor-pointer leading-snug mb-1.5 line-clamp-2"
                        title={event.title}
                      >
                        {event.title}
                      </h4>

                      <p className="text-xs font-sans text-neutral-300 line-clamp-2 leading-relaxed">
                        {event.tagline}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-emerald-900/80 flex items-center justify-between font-mono text-xs gap-2">
                        <span className="text-emerald-400 text-[11px] flex items-center gap-1 flex-1 min-w-0" title={event.venue}>
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </span>
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            if (onRegisterEvent) onRegisterEvent(event);
                            else onSelectEvent(event);
                          }}
                          className="text-amber-400 font-extrabold hover:text-amber-300 hover:underline flex items-center gap-1 text-[11px] shrink-0 bg-emerald-950 px-2.5 py-1 rounded border border-amber-500/40"
                        >
                          <span>Entry ₹{event.entryFee}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Circular Glowing Vector Node */}
                    <div className="relative flex items-center justify-center my-2 cursor-pointer"
                      onClick={() => {
                        soundFx.playClick();
                        onSelectEvent(event);
                      }}
                    >
                      {/* Outer pulse aura */}
                      <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md group-hover:bg-amber-500/40 transition-all" />

                      <div className="relative w-12 h-12 rounded-full bg-[#030d06] border-2 border-emerald-500 group-hover:border-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.4)] group-hover:scale-110 transition-transform">
                        {isTech ? (
                          <Code2 className="w-5 h-5 text-emerald-400 group-hover:text-amber-400" />
                        ) : (
                          <Gamepad2 className="w-5 h-5 text-amber-400" />
                        )}

                        {/* Top Node Badge Number (01, 02, 03, 04, 05) */}
                        <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-mono font-black text-[9px]">
                          {nodeNumber}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-emerald-500/80 uppercase">
                      SLOT {nodeNumber}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* MOBILE RESPONSIVE HIGHLY OPTIMIZED CURVED VECTOR PATHWAY */}
          <div className="md:hidden space-y-6 relative pl-6 border-l-2 border-emerald-500/40 ml-2">
            
            {/* Pulsing vertical line highlight */}
            <div className="absolute left-[-2px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-400 via-amber-400 to-emerald-600 animate-pulse pointer-events-none" />

            {dayEvents.map((event, idx) => {
              const nodeNumber = String(idx + 1).padStart(2, '0');
              const isTech = event.category === 'technical';

              return (
                <div key={event.id} className="relative group pl-4">
                  {/* Glowing Node on Line */}
                  <div className="absolute -left-[33px] top-3 w-7 h-7 rounded-full bg-[#030d06] border-2 border-emerald-400 group-hover:border-amber-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,255,102,0.6)]">
                    <span className="font-mono text-[10px] font-black text-amber-400">
                      {nodeNumber}
                    </span>
                  </div>

                  {/* Card Content Mobile */}
                  <div className="p-4 rounded-2xl bg-[#040e07]/90 border border-emerald-900 group-hover:border-emerald-400 space-y-2 shadow-lg">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isTech ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {event.category}
                      </span>
                    </div>

                    <h4
                      onClick={() => {
                        soundFx.playClick();
                        onSelectEvent(event);
                      }}
                      className="font-mono text-base font-extrabold text-white active:text-amber-400 cursor-pointer"
                    >
                      {event.title}
                    </h4>

                    <p className="text-xs font-sans text-neutral-300">
                      {event.tagline}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-emerald-950 font-mono text-xs">
                      <span className="text-emerald-500 text-[11px]">{event.venue}</span>
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          if (onRegisterEvent) onRegisterEvent(event);
                          else onSelectEvent(event);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 text-black font-extrabold text-[11px] min-h-[44px] flex items-center gap-1"
                      >
                        <span>Register ₹{event.entryFee}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* MODE 2: EVENT LIST */}
      {viewMode === 'list' && (
        <div className="relative border-l-2 border-emerald-500/40 ml-4 sm:ml-8 space-y-8 pl-6 sm:pl-8 animate-fadeIn">
          <div className="absolute left-[-2px] top-0 w-[2px] h-full bg-gradient-to-b from-emerald-400 via-amber-400 to-emerald-600 animate-pulse pointer-events-none" />

          {dayEvents.map((event) => {
            const isTech = event.category === 'technical';
            return (
              <div
                key={event.id}
                className="relative group transition-all duration-300 transform hover:-translate-y-1"
              >
                <div
                  className={`absolute -left-[33px] sm:-left-[41px] top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isTech
                      ? 'bg-emerald-950 border-emerald-400 group-hover:scale-125 shadow-[0_0_15px_rgba(0,255,102,0.8)]'
                      : 'bg-amber-950 border-amber-400 group-hover:scale-125 shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isTech ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-ping'
                    }`}
                  />
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-[#040e07]/90 border border-emerald-900 group-hover:border-emerald-400 transition-all shadow-[0_0_20px_rgba(0,0,0,0.6)] group-hover:shadow-[0_0_30px_rgba(0,255,102,0.2)]">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
                            isTech
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}
                        >
                          {event.category}
                        </span>
                      </div>

                      <h3
                        onClick={() => {
                          soundFx.playClick();
                          onSelectEvent(event);
                        }}
                        className="text-lg sm:text-xl font-mono font-black text-white group-hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <span>{event.title}</span>
                        <Sparkles className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>

                      <p className="text-xs font-sans text-neutral-300 max-w-xl">
                        {event.tagline}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 lg:flex-col lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-emerald-900 font-mono text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-neutral-300 bg-[#020703] px-2.5 py-1 rounded-lg border border-emerald-950">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{event.venue}</span>
                        </div>

                        <div className="flex items-center gap-1 text-amber-400 font-bold bg-[#020703] px-2.5 py-1 rounded-lg border border-amber-500/30">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>{event.prizePool}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            onSelectEvent(event);
                          }}
                          className="px-3.5 py-2 min-h-[44px] rounded-xl bg-[#06120a] border border-emerald-800 text-emerald-300 hover:text-white hover:border-emerald-500 transition-all flex items-center justify-center"
                        >
                          Rules & Details
                        </button>

                        {onRegisterEvent && (
                          <button
                            onClick={() => {
                              soundFx.playClick();
                              onRegisterEvent(event);
                            }}
                            className="flex items-center gap-1 px-4 py-2 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black font-extrabold shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:scale-105 transition-all justify-center"
                          >
                            <span>Register ₹{event.entryFee}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-black" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
