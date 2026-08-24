import React, { useState } from 'react';
import {
  X,
  Trophy,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  Phone,
  ShieldAlert,
  ArrowRight,
  User,
  Crown,
  BookOpen,
  Layers,
  Award,
  Flame,
  AlertCircle,
  FileCheck,
  Zap,
  Target,
  Sparkles,
  Info
} from 'lucide-react';
import { SymposiumEvent } from '../types';
import { soundFx } from './AudioEffects';

interface EventDetailModalProps {
  event: SymposiumEvent | null;
  onClose: () => void;
  onRegister: (event: SymposiumEvent) => void;
}

type ModalTab = 'overview' | 'rounds' | 'rules' | 'evaluation';

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onRegister,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');

  if (!event) return null;

  const isTech = event.category === 'technical';
  const rb = event.ruleBook;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#030a05] border-2 border-emerald-600/70 shadow-[0_0_50px_rgba(0,255,102,0.2)] text-left overflow-hidden">
        
        {/* Modal Header Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#041308] via-[#092211] to-[#041308] border-b border-emerald-800/80 shrink-0 relative">
          {/* Close Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-xl bg-[#020703] border border-emerald-800 text-neutral-400 hover:text-white hover:border-emerald-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-2 pr-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase border ${
                  isTech
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                    : 'bg-amber-950 text-amber-300 border-amber-500'
                }`}
              >
                {event.category}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-emerald-300 bg-[#020703] border border-emerald-900">
                {event.day}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-amber-400 bg-[#020703] border border-amber-900 flex items-center gap-1 font-bold">
                <BookOpen className="w-3 h-3" /> OFFICIAL RULE BOOK
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wide">
              {event.title}
            </h2>
            <p className="text-xs sm:text-sm font-mono text-amber-300/90">{event.tagline}</p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 p-3 rounded-2xl bg-[#020703]/90 border border-emerald-900/80 font-mono text-xs text-neutral-300">
            <div>
              <span className="text-[10px] text-emerald-500 block font-bold">PRIZE POOL</span>
              <div className="font-bold text-amber-400 flex items-center gap-1 truncate text-xs">
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{event.prizePool}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-emerald-500 block font-bold">VENUE</span>
              <div className="text-neutral-200 truncate text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-emerald-500 block font-bold">SQUAD FORMAT</span>
              <div className="text-neutral-200 flex items-center gap-1 text-xs">
                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{event.teamSize}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-emerald-500 block font-bold">ENTRY FEE</span>
              <div className="font-bold text-emerald-400 text-sm">₹{event.entryFee}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('overview');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'overview'
                  ? 'bg-emerald-500 text-black font-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  : 'bg-[#05140a] text-neutral-300 border-emerald-900 hover:text-white hover:border-emerald-700'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('rounds');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'rounds'
                  ? 'bg-amber-400 text-black font-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                  : 'bg-[#05140a] text-neutral-300 border-emerald-900 hover:text-white hover:border-emerald-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rounds & Challenges ({rb?.rounds?.length || 1})</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('rules');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'rules'
                  ? 'bg-emerald-500 text-black font-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  : 'bg-[#05140a] text-neutral-300 border-emerald-900 hover:text-white hover:border-emerald-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Rules & Regulations</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('evaluation');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'evaluation'
                  ? 'bg-amber-400 text-black font-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                  : 'bg-[#05140a] text-neutral-300 border-emerald-900 hover:text-white hover:border-emerald-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Evaluation & Rubric</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm text-neutral-200">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Event Purpose & Briefing */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>EVENT PURPOSE & MISSION BRIEFING</span>
                </h3>
                <p className="leading-relaxed bg-[#05110a] p-4 rounded-2xl border border-emerald-900/80 text-neutral-200">
                  {rb?.eventOverview || event.fullDescription}
                </p>
              </div>

              {/* Event Format Summary */}
              {rb?.eventFormatSummary && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#031509] to-[#072210] border border-amber-500/40 space-y-2">
                  <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>EVENT FORMAT SUMMARY</span>
                  </span>
                  <p className="text-xs font-mono text-emerald-200 leading-normal">
                    {rb.eventFormatSummary}
                  </p>
                </div>
              )}

              {/* Topics (if provided like in PosterXpo) */}
              {rb?.topics && rb.topics.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-400" />
                    <span>ANNOUNCED THEMES & TOPICS</span>
                  </h3>
                  <div className="space-y-2">
                    {rb.topics.map((t, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#040e07] border border-emerald-900 flex items-start gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-neutral-200 font-sans">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participant Flow */}
              {rb?.participantFlow && rb.participantFlow.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>OFFICIAL PARTICIPANT FLOW</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    {rb.participantFlow.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <div className="px-3 py-1.5 rounded-xl bg-[#05140a] border border-emerald-900 text-neutral-200 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                        {idx < rb.participantFlow!.length - 1 && (
                          <span className="text-amber-400 font-bold">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROUNDS & CHALLENGES */}
          {activeTab === 'rounds' && (
            <div className="space-y-4 animate-fadeIn">
              {rb?.rounds && rb.rounds.length > 0 ? (
                rb.rounds.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-[#041007] border-2 border-emerald-900/90 hover:border-amber-400/80 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-950 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/60 text-amber-300 font-mono text-xs font-bold">
                          ROUND {r.roundNumber}
                        </span>
                        <h4 className="text-base font-mono font-black text-white">
                          {r.roundName}
                        </h4>
                      </div>
                      {r.duration && (
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{r.duration}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-neutral-300 font-sans leading-relaxed">
                      {r.description}
                    </p>

                    {r.details && r.details.length > 0 && (
                      <ul className="space-y-1.5 pl-1 pt-1">
                        {r.details.map((d, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2 text-xs text-neutral-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {r.scoring && (
                      <div className="p-2.5 rounded-xl bg-[#020703] border border-amber-900/60 text-xs font-mono text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>Scoring & Weightage:</strong> {r.scoring}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-[#05110a] border border-emerald-900">
                  <p className="text-xs font-mono text-neutral-300">Single-round intensive challenge.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RULES & REGULATIONS */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/50 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-200 font-mono">
                  All participants must strictly adhere to the official Sathyabama Institute of Science and Technology code of conduct and event rules. Violations will result in immediate disqualification.
                </p>
              </div>

              <div className="space-y-2">
                {(rb?.rulesAndRegulations || event.rules).map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#040e07] border border-emerald-950 text-xs text-neutral-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EVALUATION & PRIZES */}
          {activeTab === 'evaluation' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Scoring Rubric / Evaluation Criteria */}
              {rb?.evaluationCriteria && rb.evaluationCriteria.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>OFFICIAL EVALUATION CRITERIA & SCORING RUBRIC</span>
                  </h3>
                  <div className="overflow-x-auto rounded-2xl border border-emerald-900 bg-[#020703]">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-emerald-900 bg-[#05140a] text-emerald-400">
                          <th className="p-3">Criterion</th>
                          <th className="p-3">Weightage</th>
                          <th className="p-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950 text-neutral-300">
                        {rb.evaluationCriteria.map((c, idx) => (
                          <tr key={idx} className="hover:bg-[#06180c] transition-colors">
                            <td className="p-3 font-bold text-white">{c.criterion}</td>
                            <td className="p-3 text-amber-400 font-bold">{c.weightage || '-'}</td>
                            <td className="p-3 text-neutral-300 font-sans text-xs">{c.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Prize Pool Breakdown */}
              {rb?.prizeStructure && rb.prizeStructure.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>PRIZE BREAKDOWN & HONORS</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {rb.prizeStructure.map((p, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border text-center font-mono space-y-1 ${
                          idx === 0
                            ? 'bg-amber-950/40 border-amber-500 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                            : idx === 1
                            ? 'bg-neutral-900/60 border-neutral-600 text-neutral-200'
                            : 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                        }`}
                      >
                        <div className="text-xs font-bold tracking-wider uppercase text-neutral-400">{p.place}</div>
                        <div className="text-sm font-black text-amber-300">{p.prize}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities Provided */}
              {rb?.facilitiesProvided && rb.facilitiesProvided.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>FACILITIES & AMENITIES PROVIDED</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rb.facilitiesProvided.map((fac, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#040e07] border border-emerald-900/80 flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-neutral-200 font-sans">{fac}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Coordinators Contact Section */}
          <div className="space-y-3 pt-4 border-t border-emerald-950">
            <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              EVENT STUDENT & FACULTY COORDINATORS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {event.coordinators.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#06130b] border border-emerald-900 text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>{c.name}</span>
                    </div>
                    <div className="text-[10px] text-emerald-500/80">{c.role}</div>
                  </div>

                  <a
                    href={`tel:${c.phone}`}
                    onClick={() => soundFx.playClick()}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#081b0e] hover:bg-emerald-900/60 text-amber-400 border border-emerald-800 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span className="text-[11px]">{c.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Sticky Footer Action Button */}
        <div className="p-4 bg-[#020703] border-t border-emerald-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-mono">
            <span className="text-neutral-400 block">Registration Fee</span>
            <span className="text-lg font-black text-amber-400">₹{event.entryFee}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-[#05130a] hover:bg-emerald-950 border border-emerald-800 font-mono text-xs text-neutral-300 transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                onRegister(event);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-black font-mono text-xs font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer"
            >
              <span>REGISTER NOW</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
