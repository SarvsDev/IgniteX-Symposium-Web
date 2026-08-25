import React, { useState } from 'react';
import {
  Code2,
  Gamepad2,
  Search,
  Crown,
  Trophy,
  Filter,
  Sparkles,
  Zap,
} from 'lucide-react';
import { SymposiumEvent } from '../types';
import { EventCard } from './EventCard';
import { soundFx } from './AudioEffects';

interface EventsPageProps {
  events: SymposiumEvent[];
  initialCategory?: 'all' | 'technical' | 'non-technical';
  onSelectEvent: (event: SymposiumEvent) => void;
  onQuickRegister: (event: SymposiumEvent) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
  initialCategory = 'all',
  onSelectEvent,
  onQuickRegister,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'technical' | 'non-technical'>(initialCategory);
  const [dayFilter, setDayFilter] = useState<'all' | 'Day 1' | 'Day 2'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const technicalEvents = events.filter((e) => e.category === 'technical');
  const nonTechnicalEvents = events.filter((e) => e.category === 'non-technical');

  const filteredEvents = events.filter((e) => {
    const matchesCategory = activeTab === 'all' || e.category === activeTab;
    const matchesDay = dayFilter === 'all' || e.day === dayFilter;
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesDay && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,102,0.3)]">
          <Crown className="w-4 h-4 text-amber-400" />
          <span>IGNITEX SECTOR BLUEPRINTS // {events.length} CHALLENGES</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-mono font-black text-white uppercase tracking-tight">
          SYMPOSIUM <span className="text-amber-400">EVENT MATRIX</span>
        </h1>
        <p className="text-neutral-300 font-sans text-sm sm:text-base leading-relaxed">
          Explore all {events.length} IgniteX challenges sorted into Technical & Non-Technical sectors with custom squad sizes and dynamic entry fees.
        </p>

        {/* Pricing & Registration Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#031c0d] via-[#0b2914] to-[#1a1403] border-2 border-emerald-500/80 text-left font-mono space-y-3 shadow-[0_0_30px_rgba(0,255,102,0.25)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">
                  FEATURED COMBO PASS // SAVE ₹100
                </span>
                <h3 className="text-lg sm:text-xl font-mono font-black text-white uppercase">
                  EVERY INDIVIDUAL EVENT ACCESS — ₹500
                </h3>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playSuccess();
                onQuickRegister({
                  id: 'combo-individual-all-access',
                  title: 'All Individual Events Access Pass',
                  tagline: 'VIP All-Access Pass unlocking all 4 individual events (Profile Architect, Neural Rush, Prompt Perfect, Memergency)',
                  category: 'technical',
                  day: 'Day 1',
                  time: 'Sept 9 & 10 (Full Access)',
                  venue: 'All Individual Tracks (Zones A, C, X & Placement Labs)',
                  teamSize: 'Individual (1 Member)',
                  maxTeamSize: 1,
                  entryFee: 500,
                  prizePool: '₹50,000 Total Prize Pool',
                  shortDescription: 'Unlocks entry to all 4 individual events for a single flat pass of ₹500 (Save ₹100 compared to individual registrations).',
                  fullDescription: 'One single all-access pass for individual competitors. Grants full verified entry to Profile Architect (Resume Building), Neural Rush (Gen AI Clash), Prompt Perfect, and Memergency.',
                  rules: [
                    'Valid for 1 individual participant across all 4 individual events.',
                    'Grants complete access to all 4 individual competitions for a flat ₹500 fee (Save ₹100).',
                    'Single QR Pass grants entry to all individual event arenas with refreshments included.',
                    'Certificates awarded for each individual event completed.'
                  ],
                  coordinators: [
                    { name: 'IgniteX Chief Proctor', phone: '+91 98765 43210', role: 'Symposium Director' }
                  ],
                  slotsTotal: 100,
                  slotsFilled: 68,
                  iconName: 'Ticket',
                  featured: true,
                });
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-mono text-xs font-black hover:scale-[1.03] transition-all shadow-[0_0_20px_rgba(234,179,8,0.5)] shrink-0"
            >
              <Zap className="w-4 h-4 text-black" />
              <span>GRAB COMBO PASS (₹500)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-900/80 font-sans text-xs text-neutral-200">
            <div className="flex items-center gap-1.5 bg-[#020904]/80 p-2 rounded-lg border border-emerald-950">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Resume Building (₹150)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#020904]/80 p-2 rounded-lg border border-emerald-950">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Error Hunt (₹150)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#020904]/80 p-2 rounded-lg border border-emerald-950">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Prompt Perfect (₹150)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#020904]/80 p-2 rounded-lg border border-emerald-950">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Memergency (₹150)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Category Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-emerald-900 pb-4">
        
        {/* Category Buttons */}
        <div className="flex items-center bg-[#06120a] p-1.5 rounded-2xl border border-emerald-900 w-full sm:w-auto font-mono text-xs">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('all');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black font-extrabold shadow-[0_0_20px_rgba(0,255,102,0.4)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>All Events ({events.length})</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('technical');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
              activeTab === 'technical'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Technical ({technicalEvents.length})</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('non-technical');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
              activeTab === 'non-technical'
                ? 'bg-amber-950 text-amber-300 border border-amber-500 font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            <span>Non-Technical ({nonTechnicalEvents.length})</span>
          </button>
        </div>

        {/* Day & Search Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Day Filter */}
          <select
            value={dayFilter}
            onChange={(e) => {
              soundFx.playClick();
              setDayFilter(e.target.value as any);
            }}
            className="bg-[#06120a] border border-emerald-900 rounded-xl px-3.5 py-2.5 text-emerald-300 font-mono text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Days (Sept 9 & 10)</option>
            <option value="Day 1">Day 1 (Sept 9)</option>
            <option value="Day 2">Day 2 (Sept 10)</option>
          </select>
        </div>

      </div>

      {/* Search Input */}
      <div className="relative max-w-md mx-auto">
        <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search event title, rules, keywords..."
          className="w-full bg-[#06120a] border border-emerald-900 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-emerald-600 focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* SEPARATE SECTIONS MODE (If 'all' selected, show distinct Technical and Non-Technical sections) */}
      {activeTab === 'all' && !searchQuery && dayFilter === 'all' ? (
        <div className="space-y-12">
          
          {/* SECTION 1: TECHNICAL EVENTS */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-900 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-mono font-bold text-white uppercase">
                  TECHNICAL CHALLENGES <span className="text-emerald-400 text-sm">(5 EVENTS)</span>
                </h2>
              </div>
              <span className="text-xs font-mono text-emerald-500">₹30,000 Prize Pool</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {technicalEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelectEvent={onSelectEvent}
                  onQuickRegister={onQuickRegister}
                />
              ))}
            </div>
          </div>

          {/* SECTION 2: NON-TECHNICAL EVENTS */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-900 pb-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-mono font-bold text-white uppercase">
                  NON-TECHNICAL CHALLENGES <span className="text-amber-400 text-sm">(4 EVENTS)</span>
                </h2>
              </div>
              <span className="text-xs font-mono text-amber-500">₹20,000 Prize Pool</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nonTechnicalEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelectEvent={onSelectEvent}
                  onQuickRegister={onQuickRegister}
                />
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* FILTERED GRID MODE */
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 border-b border-emerald-900 pb-2">
            <span>SHOWING {filteredEvents.length} MATCHING EVENTS</span>
            <span className="text-amber-400 uppercase">{activeTab} CATEGORY</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center space-y-2 border border-dashed border-emerald-900 rounded-2xl bg-[#030a05]/60">
              <Search className="w-8 h-8 text-emerald-800 mx-auto" />
              <p className="text-sm font-mono text-emerald-400">
                No events found matching your filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelectEvent={onSelectEvent}
                  onQuickRegister={onQuickRegister}
                />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
