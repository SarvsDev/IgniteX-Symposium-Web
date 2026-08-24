import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Crown,
  Zap,
  Code2,
  Gamepad2,
  ArrowRight,
} from 'lucide-react';
import { SymposiumEvent, Registration, User } from './types';
import { EVENTS_DATA } from './data/eventsData';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { EventsPage } from './components/EventsPage';
import { EventCard } from './components/EventCard';
import { EventDetailModal } from './components/EventDetailModal';
import { RegistrationModal } from './components/RegistrationModal';
import { TicketPassModal } from './components/TicketPassModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ScheduleTimeline } from './components/ScheduleTimeline';
import { SurvivalProtocol } from './components/SurvivalProtocol';
import { ParticipantDetailsModal } from './components/ParticipantDetailsModal';
import { MultiEventRegisterPage } from './components/MultiEventRegisterPage';
import { DrDoomBackground } from './components/DrDoomBackground';
import { YellowLightningTouchEffect } from './components/YellowLightningTouchEffect';
import { InitiatingGate } from './components/InitiatingGate';
import { soundFx } from './components/AudioEffects';
import { getStoredRegistrations } from './lib/storage';

export default function App() {
  // Gate / Initiating Page state
  const [hasEnteredGate, setHasEnteredGate] = useState(false);

  // Application State
  const [events, setEvents] = useState<SymposiumEvent[]>(EVENTS_DATA);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ignitex_local_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userRegistrations, setUserRegistrations] = useState<Registration[]>(() => {
    return getStoredRegistrations();
  });
  const [activeSection, setActiveSection] = useState<'home' | 'tech-events' | 'non-tech-events' | 'events' | 'timeline' | 'protocol' | 'register'>('register');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals
  const [selectedEventDetails, setSelectedEventDetails] = useState<SymposiumEvent | null>(null);
  const [selectedRegisterEvent, setSelectedRegisterEvent] = useState<SymposiumEvent | null>(null);
  const [showTicketWallet, setShowTicketWallet] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [showParticipantDetailsModal, setShowParticipantDetailsModal] = useState(false);

  // Check for /admin route
  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || path === '/admin/' || hash === '#admin') {
        setShowAdminPortal(true);
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  // Sync user registrations on storage changes
  useEffect(() => {
    const syncFromStorage = () => {
      setUserRegistrations(getStoredRegistrations());
    };
    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ignitex_local_user');
  };

  const handleRegistrationSuccess = (newReg: Registration) => {
    setUserRegistrations((prev) => [newReg, ...prev.filter((r) => r.id !== newReg.id)]);
    setSelectedRegisterEvent(null);
  };

  const handleBatchRegistrationSuccess = (newRegs: Registration[]) => {
    const newIds = new Set(newRegs.map((r) => r.id));
    setUserRegistrations((prev) => [...newRegs, ...prev.filter((r) => !newIds.has(r.id))]);
  };

  return (
    <div className="min-h-screen bg-[#030905] text-neutral-100 font-sans selection:bg-emerald-500 selection:text-black relative overflow-x-hidden">
      
      {/* Initiating Opening Splash Gate */}
      {!hasEnteredGate && (
        <InitiatingGate onEnter={() => setHasEnteredGate(true)} />
      )}

      {/* Animated Dr. Doom background canvas (Interactive with Cursor & Clicks) */}
      <DrDoomBackground interactive={true} />

      {/* Full-Screen Interactive Yellow Lightning & Spark Particle Touch Effect */}
      <YellowLightningTouchEffect />

      {/* Top Header Navigation */}
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenTicketPass={() => setShowTicketWallet(true)}
        onOpenDetailsModal={() => setShowParticipantDetailsModal(true)}
        activeSection={activeSection}
        setActiveSection={(sec) => setActiveSection(sec as any)}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onReopenGate={() => setHasEnteredGate(false)}
      />

      {/* Main Content Body */}
      <main className="space-y-16 pb-16 relative z-10 pt-4">
        
        {/* VIEW 1: LANDING PAGE (Hero, Animated Timings Timeline, Survival Protocols) */}
        {activeSection === 'home' && (
          <div className="space-y-16 animate-fadeIn">
            
            {/* Hero Section */}
            <HeroSection
              onExploreEvents={() => setActiveSection('events')}
              onRegisterMultiple={() => setActiveSection('register')}
              onOpenTicketPass={() => setShowTicketWallet(true)}
              onOpenInfo={() => setActiveSection('protocol')}
            />

            {/* Quick Challenge Navigator Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#041208] via-[#081a0e] to-[#041208] border border-emerald-500/40 shadow-[0_0_30px_rgba(0,255,102,0.15)] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1">
                    <Crown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>DEDICATED EVENT TRACKS</span>
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-mono font-black text-white uppercase">
                    EXPLORE 9 IGNITEX CHALLENGES
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 font-sans max-w-xl">
                    Events are organized into separate Technical & Non-Technical tracks for seamless exploration, rules review, and QR pass registration.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setActiveSection('events');
                    }}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black font-mono text-xs font-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,102,0.4)]"
                  >
                    <Zap className="w-4 h-4 text-black" />
                    <span>VIEW ALL 9 EVENTS (₹500 ALL-ACCESS PASS)</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Animated Timeline of Event Timings on Landing Page */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center space-y-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ANIMATED EVENT TIMINGS TIMELINE // 2 DAYS</span>
                </span>
                <h2 className="text-2xl sm:text-4xl font-mono font-black text-white uppercase tracking-tight">
                  IGNITEX SYMPOSIUM SCHEDULE
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 font-sans max-w-xl mx-auto">
                  Interactive real-time event schedule. Click any slot to review event rules or mint your entry pass.
                </p>
              </div>

              <ScheduleTimeline
                events={events}
                onSelectEvent={(e) => setSelectedEventDetails(e)}
                onRegisterEvent={(e) => setSelectedRegisterEvent(e)}
              />
            </section>

            {/* Survival Protocol Rules Overview */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>IGNITEX PROTOCOLS</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-mono font-black text-white uppercase">
                  ENTRY GUIDELINES & FAQS
                </h2>
              </div>

              <SurvivalProtocol />
            </section>

          </div>
        )}

        {/* VIEW 2: UNIFIED EVENTS MATRIX */}
        {(activeSection === 'events' || activeSection === 'tech-events' || activeSection === 'non-tech-events') && (
          <EventsPage
            key={activeSection}
            events={events}
            initialCategory={
              activeSection === 'tech-events'
                ? 'technical'
                : activeSection === 'non-tech-events'
                ? 'non-technical'
                : 'all'
            }
            onSelectEvent={(e) => setSelectedEventDetails(e)}
            onQuickRegister={(e) => setSelectedRegisterEvent(e)}
          />
        )}

        {/* VIEW 5: DEDICATED TIMELINE SCHEDULER */}
        {activeSection === 'timeline' && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <Crown className="w-3.5 h-3.5 text-emerald-400" />
                <span>2-DAY QUANTUM SCHEDULE</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-mono font-black text-white uppercase">
                IGNITEX '26 EVENT TIMINGS
              </h2>
            </div>

            <ScheduleTimeline
              events={events}
              onSelectEvent={(e) => setSelectedEventDetails(e)}
              onRegisterEvent={(e) => setSelectedRegisterEvent(e)}
            />
          </section>
        )}

        {/* VIEW 6: SURVIVAL PROTOCOL MANUAL */}
        {activeSection === 'protocol' && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <Crown className="w-3.5 h-3.5 text-emerald-400" />
                <span>SURVIVAL MANUAL</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-mono font-black text-white uppercase">
                IGNITEX CODE OF CONDUCT & GATE RULES
              </h2>
            </div>

            <SurvivalProtocol />
          </section>
        )}

        {/* VIEW 7: DEDICATED MULTI-EVENT REGISTRATION PORTAL */}
        {activeSection === 'register' && (
          <MultiEventRegisterPage
            events={events}
            user={user}
            onRegistrationSuccess={handleBatchRegistrationSuccess}
            onViewTicketPass={() => setShowTicketWallet(true)}
          />
        )}

      </main>

      {/* Modals & Portals */}
      <EventDetailModal
        event={selectedEventDetails}
        onClose={() => setSelectedEventDetails(null)}
        onRegister={(e) => {
          setSelectedEventDetails(null);
          setSelectedRegisterEvent(e);
        }}
      />

      <RegistrationModal
        event={selectedRegisterEvent}
        user={user}
        onClose={() => setSelectedRegisterEvent(null)}
        onSuccess={handleRegistrationSuccess}
      />

      {showTicketWallet && (
        <TicketPassModal
          registrations={
            user?.email
              ? userRegistrations.filter((r) => r.userEmail?.toLowerCase() === user.email?.toLowerCase())
              : userRegistrations
          }
          onClose={() => setShowTicketWallet(false)}
        />
      )}

      {showAdminPortal && (
        <AdminDashboard
          onClose={() => {
            setShowAdminPortal(false);
            if (window.location.pathname.toLowerCase().startsWith('/admin')) {
              window.history.pushState({}, '', '/');
            }
          }}
        />
      )}

      {showParticipantDetailsModal && user && (
        <ParticipantDetailsModal
          user={user}
          onClose={() => setShowParticipantDetailsModal(false)}
          onSaveSuccess={(updatedUser) => {
            setUser(updatedUser);
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-[#020703] border-t border-emerald-950 py-8 font-mono text-xs text-neutral-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">IGNITEX 2026 // SYMPOSIUM</span>
          </div>

          <div className="text-emerald-500/80 text-center md:text-right">
            <span>Powered by IgniteX Tech Council • 256-Bit QR Verification</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
