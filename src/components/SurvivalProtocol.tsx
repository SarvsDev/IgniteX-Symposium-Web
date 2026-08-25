import React, { useState } from 'react';
import { ShieldCheck, Bus, Radio, HelpCircle, Crown, Utensils, Building2, MapPin, CheckCircle2, AlertTriangle, X, Navigation, Phone, ExternalLink, Clock, FileText, Download } from 'lucide-react';
import { BusRoutesModal } from './BusRoutesModal';

export const SurvivalProtocol: React.FC = () => {
  const [showBusRoutesModal, setShowBusRoutesModal] = useState(false);

  const faqs = [
    {
      q: 'Can I register for multiple events across Day 1 and Day 2?',
      a: 'Yes! Participants may register for up to 3 events provided their scheduled timings do not directly overlap in the IgniteX sector timetable.',
    },
    {
      q: 'How do I receive my verified IgniteX QR Ticket Pass?',
      a: 'Upon completing payment via UPI, Card, or Netbanking, an encrypted QR ticket pass is automatically minted and stored in your Ticket Wallet. You can print or download it.',
    },
    {
      q: 'What is required at the venue gate for entrance verification?',
      a: 'Present your IgniteX QR Ticket Pass (digital or printed) along with your valid physical or digital college photo ID card at Sector Gate 1.',
    },
    {
      q: 'Are food, college bus travel, and accommodation provided?',
      a: 'Breakfast and Lunch are provided for all registered participants in the Students Mess. Registered students can use the college bus on all operational routes (click "View Bus Routes" for details). Please note that no hostel/campus accommodation is provided.',
    },
  ];

  return (
    <div className="space-y-8 text-left">
      
      {/* ILLUMINATED INFO DIRECTORY: FOOD • TRAVEL • ACCOMMODATION */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#031409] via-[#082210] to-[#031409] border-2 border-emerald-500/80 shadow-[0_0_35px_rgba(0,255,102,0.25)] space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-900/80 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-emerald-400" />
              <span>IGNITEX LOGISTICS DIRECTORY</span>
            </span>
            <h3 className="text-2xl font-mono font-black text-white uppercase tracking-tight">
              FOOD • TRAVEL • ACCOMMODATION
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-mono text-xs font-bold">
            INCLUDED WITH ALL REGISTRATIONS & PASSES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* FOOD CARD: BREAKFAST & LUNCH IN STUDENTS MESS */}
          <div className="p-5 rounded-2xl bg-[#020904] border border-emerald-800/80 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(234,179,8,0.3)] transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  Students Mess
                </span>
                <h4 className="font-mono text-base font-black text-amber-300 uppercase mt-1">
                  BREAKFAST & LUNCH PROVIDED
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-neutral-300 font-sans">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Breakfast & Lunch</strong> are provided in the <strong>Students Mess</strong> for all registered participants.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Morning Breakfast served in Students Mess from 08:00 AM – 08:30 AM before event kickoff.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Grand Mess Buffet Lunch on both Day 1 (Sept 9) and Day 2 (Sept 10).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Energy refreshments, snacks & beverages available throughout.</span>
                </li>
              </ul>
            </div>
            <div className="pt-2">
              <div className="text-[11px] font-mono text-emerald-400/90 bg-emerald-950/60 p-2 rounded-xl border border-emerald-900 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Venue: Sathyabama Students Mess Hall</span>
              </div>
            </div>
          </div>

          {/* TRAVEL CARD: COLLEGE BUS IN ALL ROUTES + VIEW ROUTES BUTTON */}
          <div className="p-5 rounded-2xl bg-[#020904] border border-emerald-800/80 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(0,255,102,0.3)] transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  All Routes Available
                </span>
                <h4 className="font-mono text-base font-black text-emerald-300 uppercase mt-1">
                  COLLEGE BUS TRANSIT
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-neutral-300 font-sans">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Registered students can use <strong>The College Bus in all of the routes</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Complimentary boarding with your verified IgniteX Registration Pass or College ID.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Morning pickup across all standard operating routes and evening return drop-off.</span>
                </li>
              </ul>
            </div>
            
            {/* ACTION BUTTON: VIEW BUS ROUTES */}
            <div className="pt-3">
              <button
                id="btn-view-bus-routes"
                onClick={() => setShowBusRoutesModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-black font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:shadow-[0_0_30px_rgba(0,255,102,0.6)] transition-all cursor-pointer"
              >
                <Bus className="w-4 h-4 text-black" />
                <span>VIEW BUS ROUTES</span>
                <ExternalLink className="w-3.5 h-3.5 text-black ml-0.5" />
              </button>
            </div>
          </div>

          {/* ACCOMMODATION CARD: NO ACCOMMODATION */}
          <div className="p-5 rounded-2xl bg-[#020904] border border-rose-900/80 hover:border-rose-500/80 hover:shadow-[0_0_25px_rgba(244,63,94,0.25)] transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                  Important Notice
                </span>
                <h4 className="font-mono text-base font-black text-rose-300 uppercase mt-1">
                  NO ACCOMMODATION
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-neutral-300 font-sans">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>No hostel or campus accommodation</strong> is provided for participants.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <span>IgniteX'26 operates on an active schedule (08:30 AM – 02:45 PM).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <span>Participants are advised to plan daily commutes using the college bus routes or make external lodging arrangements.</span>
                </li>
              </ul>
            </div>
            <div className="pt-2">
              <div className="text-[11px] font-mono text-amber-300/90 bg-amber-950/40 p-2 rounded-xl border border-amber-900/60 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Symposium Day Timing: 8:30 AM – 2:45 PM</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* OFFICIAL LOCATION + RULEBOOK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-[#040e07]/90 border border-emerald-900 space-y-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-white uppercase">OFFICIAL CAMPUS LOCATION</h3>
              <p className="text-xs text-neutral-400 mt-1">Open the official Google Maps location for the event venue.</p>
            </div>
          </div>
          <a
            href="https://maps.app.goo.gl/ZzZBhWgiLsomuqaXA"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 text-black font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            OPEN LOCATION IN GOOGLE MAPS
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="p-6 rounded-2xl bg-[#040e07]/90 border border-emerald-900 space-y-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-white uppercase">OFFICIAL RULEBOOK & SCHEDULE</h3>
              <p className="text-xs text-neutral-400 mt-1">IGNITEX'26 official rules, event schedules, venues, team sizes, and event requirements.</p>
            </div>
          </div>
          <a
            href="/IGNITEX_26_Rulebook_Event_Schedule.pdf"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-amber-400 text-black font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-300 transition-colors"
          >
            <FileText className="w-4 h-4" />
            VIEW OFFICIAL RULEBOOK
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="/IGNITEX_26_Rulebook_Event_Schedule.pdf"
            download
            className="w-full py-2.5 px-4 rounded-xl border border-emerald-800 text-emerald-300 font-mono text-[11px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-emerald-950 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            DOWNLOAD PDF
          </a>
        </div>
      </div>

      {/* Protocol Quick Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#040e07]/90 border border-emerald-900 space-y-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h3 className="font-mono text-sm font-bold text-white uppercase">COLLEGE ID MANDATORY</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            All participants must carry a valid physical or digital college ID card alongside their IgniteX QR pass.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#040e07]/90 border border-emerald-900 space-y-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <Bus className="w-6 h-6 text-amber-400" />
          <h3 className="font-mono text-sm font-bold text-white uppercase">GATE NO 1 ENTRANCE</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Entry gates open at 08:00 AM. Events commence from 08:30 AM sharp. Scanning points located at Sector Gate 1.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#040e07]/90 border border-emerald-900 space-y-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <Radio className="w-6 h-6 text-emerald-400" />
          <h3 className="font-mono text-sm font-bold text-white uppercase">LIVE JUDGING & FAIR PLAY</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Strict anti-cheat protocols are enforced by IgniteX's security matrix. Any external network attack will lead to immediate ban.
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="p-6 rounded-2xl bg-[#040e07]/90 border border-emerald-900 space-y-4">
        <h3 className="font-mono text-sm font-bold text-white uppercase flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          <span>IGNITEX SURVIVAL PROTOCOL & FREQUENTLY ASKED QUESTIONS</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#020703] border border-emerald-950 space-y-1">
              <h4 className="font-mono text-xs font-bold text-emerald-400">{f.q}</h4>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLLEGE BUS ROUTES MODAL (ALL 19 ROUTES) */}
      {/* ========================================================================= */}
      {showBusRoutesModal && (
        <BusRoutesModal onClose={() => setShowBusRoutesModal(false)} />
      )}

    </div>
  );
};


