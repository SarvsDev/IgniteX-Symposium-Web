import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Zap,
  Users,
  User as UserIcon,
  Ticket,
  CreditCard,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Flame,
  Info,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Layers,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { SymposiumEvent, Registration, User } from '../types';
import { soundFx } from './AudioEffects';
import { compressImageFile } from '../lib/imageCompressor';
import { QRAttachZone } from './QRAttachZone';

interface MultiEventRegisterPageProps {
  events: SymposiumEvent[];
  user: User | null;
  initialEventId?: string | null;
  onRegistrationSuccess: (registrations: Registration[]) => void;
  onViewTicketPass: () => void;
}

export function MultiEventRegisterPage({
  events,
  user,
  initialEventId,
  onRegistrationSuccess,
  onViewTicketPass
}: MultiEventRegisterPageProps) {
  // Event selection state
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'technical' | 'non-technical' | 'selected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form details
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [college, setCollege] = useState(user?.college || '');
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [collegeYear, setCollegeYear] = useState(user?.collegeYear || '1st Year');
  const [age, setAge] = useState('20');

  // Team details for selected team events: { [eventId]: { teamName: '', teamMembers: ['', ''] } }
  const [teamDetails, setTeamDetails] = useState<Record<string, { teamName: string; teamMembers: string[] }>>({});

  // Page Step State: 'selection' (Event & Details) -> 'payment' (Dedicated Bank Transfer Payment & Proof Page)
  const [step, setStep] = useState<'selection' | 'payment'>('selection');

  // Payment & Proof state
  const [transactionId, setTransactionId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mintedPasses, setMintedPasses] = useState<Registration[] | null>(null);

  // Sync user profile when user changes
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone && !user.phone.includes('00000')) setPhone(user.phone);
      if (user.college) setCollege(user.college);
      if (user.department) setDepartment(user.department);
      if (user.collegeYear) setCollegeYear(user.collegeYear);
    }
  }, [user]);

  // If registration was opened from a specific event card/URL, preselect that event
  // while keeping the user inside the unified multi-event registration portal.
  useEffect(() => {
    if (!initialEventId) return;
    const exists = events.some((event) => event.id === initialEventId);
    if (exists) {
      setSelectedEventIds((prev) => prev.includes(initialEventId) ? prev : [initialEventId, ...prev]);
    }
  }, [initialEventId, events]);

  // Keep team/squad form state isolated per event.
  const handleTeamNameChange = (eventId: string, value: string) => {
    setTeamDetails((prev) => ({
      ...prev,
      [eventId]: {
        teamName: value,
        teamMembers: prev[eventId]?.teamMembers?.length ? prev[eventId].teamMembers : [name || ''],
      },
    }));
  };

  const handleTeamMemberChange = (eventId: string, memberIndex: number, value: string) => {
    setTeamDetails((prev) => {
      const current = prev[eventId] || { teamName: '', teamMembers: [name || ''] };
      const members = [...(current.teamMembers || [])];
      while (members.length <= memberIndex) members.push('');
      members[memberIndex] = value;
      return {
        ...prev,
        [eventId]: { ...current, teamMembers: members },
      };
    });
  };

  // Individual 4 solo events for combo pass
  const soloEventIds = ['tech-profile-architect', 'nontech-prompt-perfect', 'nontech-memergency'];
  const comboEventIds = ['tech-profile-architect', 'nontech-memergency', 'nontech-prompt-perfect'];

  // Toggle single event
  const toggleEventSelection = (event: SymposiumEvent) => {
    soundFx.playClick();
    setSelectedEventIds((prev) => {
      if (prev.includes(event.id)) {
        return prev.filter((id) => id !== event.id);
      } else {
        return [...prev, event.id];
      }
    });
  };

  // Quick preset selectors
  const selectAllTechnical = () => {
    soundFx.playClick();
    const techIds = events.filter(e => e.category === 'technical').map(e => e.id);
    setSelectedEventIds(prev => Array.from(new Set([...prev, ...techIds])));
  };

  const selectAllNonTechnical = () => {
    soundFx.playClick();
    const nonTechIds = events.filter(e => e.category === 'non-technical').map(e => e.id);
    setSelectedEventIds(prev => Array.from(new Set([...prev, ...nonTechIds])));
  };

  const selectAllIndividualCombo = () => {
    soundFx.playSuccess();
    const individualIds = events.filter(e => comboEventIds.includes(e.id)).map(e => e.id);
    setSelectedEventIds(individualIds);
  };

  const selectAllNineEvents = () => {
    soundFx.playZap();
    const allIds = events.map(e => e.id);
    setSelectedEventIds(allIds);
  };

  const clearAllSelections = () => {
    soundFx.playClick();
    setSelectedEventIds([]);
  };

  // Filter the event list shown on the registration page.
  // This was previously missing, which caused a ReferenceError and a blank React page.
  const filteredEvents = events.filter((event) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesCategory =
      categoryFilter === 'all' ||
      (categoryFilter === 'selected'
        ? selectedEventIds.includes(event.id)
        : event.category === categoryFilter);
    const matchesSearch =
      !normalizedQuery ||
      event.title.toLowerCase().includes(normalizedQuery) ||
      event.tagline.toLowerCase().includes(normalizedQuery) ||
      event.shortDescription.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesSearch;
  });

  // Calculate pricing & combo discounts
  const selectedEvents = events.filter(e => selectedEventIds.includes(e.id));
  const rawTotalFee = selectedEvents.reduce((acc, e) => acc + e.entryFee, 0);

  // Apply combo flat price ₹400 if the 3 included combo events are selected
  const isAllIndividualComboSelected = comboEventIds.every(id => selectedEventIds.includes(id)) && selectedEvents.length === comboEventIds.length && selectedEvents.every(e => comboEventIds.includes(e.id));
  const isEligibleForComboDiscount = isAllIndividualComboSelected;
  const comboDiscount = isEligibleForComboDiscount ? Math.max(0, rawTotalFee - 400) : 0;
  const finalPayableAmount = Math.max(0, rawTotalFee - comboDiscount);

  // Validate Form & Redirect to Dedicated Payment Page
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);

    if (selectedEventIds.length === 0) {
      setErrorMessage('Please select at least 1 event to register before proceeding to payment.');
      soundFx.playAlert();
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter your full participant name.');
      soundFx.playAlert();
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address for pass dispatch.');
      soundFx.playAlert();
      return;
    }

    if (!phone.trim() || phone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile phone number.');
      soundFx.playAlert();
      return;
    }

    // Validate every team event before the user reaches payment. The database and
    // frontend use the same min/max team constraints, so invalid squads never
    // reach the payment/submit step.
    for (const ev of selectedEvents) {
      if (ev.maxTeamSize > 1) {
        const t = teamDetails[ev.id];
        if (!t?.teamName?.trim()) {
          setErrorMessage(`Please specify a Team / Squad Name for '${ev.title}'.`);
          soundFx.playAlert();
          return;
        }

        const uniqueNames = new Set(
          [name.trim(), ...(t.teamMembers || [])]
            .map((member) => member.trim().toLowerCase())
            .filter(Boolean)
        );
        const minMembers = ev.minTeamSize ?? 2;
        const maxMembers = ev.maxTeamSize;

        if (uniqueNames.size < minMembers || uniqueNames.size > maxMembers) {
          setErrorMessage(
            `${ev.title} requires ${minMembers}-${maxMembers} unique members. Please complete the teammate fields before continuing to payment.`
          );
          soundFx.playAlert();
          return;
        }
      }
    }

    // Redirect to Dedicated Payment Page
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit multi-event registration (From Dedicated Payment Page)
  const handleSubmitBatchRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);

    if (selectedEventIds.length === 0) {
      setErrorMessage('Please select at least 1 event to register.');
      setStep('selection');
      soundFx.playAlert();
      return;
    }

    if (!transactionId.trim()) {
      setErrorMessage('TRANSACTION ID REQUIRED: Please enter the bank transaction/reference number.');
      soundFx.playAlert();
      return;
    }

    if (!paymentScreenshot) {
      setErrorMessage('PAYMENT SCREENSHOT REQUIRED: Please upload screenshot proof of your bank transfer.');
      soundFx.playAlert();
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        participant: {
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          age: age.trim() || undefined,
          college: college.trim(),
          department: department.trim() || undefined,
          college_year: collegeYear.trim() || undefined,
        },
        selected_events: selectedEvents.map((ev) => ({ event_id: ev.id })),
        teams: selectedEvents
          .filter((ev) => ev.maxTeamSize > 1)
          .map((ev) => ({
            event_id: ev.id,
            team_name: teamDetails[ev.id]?.teamName?.trim() || '',
            members: (teamDetails[ev.id]?.teamMembers || [])
              .filter((member) => member.trim())
              .map((member) => ({ name: member.trim() })),
          })),
        payment: {
          transaction_id: transactionId.trim(),
          payment_screenshot_url: paymentScreenshot,
          payment_gateway: 'BANK_TRANSFER',
        },
      };

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let result: any;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        const snippet = responseText.trim().replace(/\s+/g, ' ').slice(0, 240);
        throw new Error(
          response.status === 404
            ? 'Registration API is not deployed. Please check the Vercel /api configuration.'
            : snippet
              ? `Registration server returned ${response.status}: ${snippet}`
              : `Registration server returned an invalid response (${response.status}).`
        );
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || result.message || `Registration failed (${response.status})`);
      }

      const newRegs: Registration[] = result.data?.registrations || [];
      if (!newRegs.length) {
        throw new Error('Registration was created but no registration details were returned.');
      }

      soundFx.playSuccess();
      setMintedPasses(newRegs);
      onRegistrationSuccess(newRegs);
    } catch (err: any) {
      console.error('Multi-event registration error:', err);
      setErrorMessage(err.message || 'Registration failed. Please try again.');
      soundFx.playAlert();
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (mintedPasses && mintedPasses.length > 0) {
    const totalAmount = finalPayableAmount;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn space-y-8">
        {/* Success Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-[#061a0d] to-[#030d06] border border-emerald-500/50 shadow-[0_0_50px_rgba(0,255,102,0.25)] text-center space-y-4 relative overflow-hidden">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              REGISTRATION SUBMITTED // PENDING ADMIN VERIFICATION
            </span>
            <h1 className="text-3xl sm:text-4xl font-mono font-black text-white uppercase tracking-tight">
              REGISTERED SUCCESSFULLY! ({mintedPasses.length} EVENTS)
            </h1>
            <p className="text-sm text-neutral-300 font-sans max-w-xl mx-auto">
              Your registrations for <strong className="text-white">{mintedPasses.length} events</strong> have been submitted to the IgniteX Command Center for verification.
            </p>
          </div>

          {/* Pending Approval Notice */}
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-left font-mono text-xs space-y-2 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>STATUS: PENDING ADMIN APPROVAL</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                UNDER REVIEW
              </span>
            </div>
            <p className="text-[11px] text-neutral-300">
              Payment reference: <strong className="text-amber-300 font-mono">{transactionId}</strong> (Total ₹{totalAmount})
            </p>
            <p className="text-[11px] text-emerald-300">
              ⚡ The IgniteX admin team will review your transaction. Once approved, your official entry passes with <strong>unique alphanumeric pass codes</strong> and <strong>gate QR codes</strong> will be generated and dispatched to <strong className="text-white">{email}</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                soundFx.playClick();
                setMintedPasses(null);
                setSelectedEventIds([]);
                setStep('selection');
              }}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black font-mono text-xs font-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              Register Another Participant
            </button>
          </div>
        </div>

        {/* Registered Events Summary Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-mono font-bold text-white uppercase flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>SUBMITTED EVENTS ({mintedPasses.length})</span>
            </h3>
            <span className="text-xs font-mono text-neutral-400">
              Total Amount: ₹{totalAmount}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mintedPasses.map((reg) => (
              <div
                key={reg.id}
                className="p-5 rounded-2xl bg-[#040f07] border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                      {reg.eventCategory.toUpperCase()}
                    </span>
                    <h4 className="text-base font-mono font-bold text-white uppercase mt-1">
                      {reg.eventTitle}
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    PENDING REVIEW
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-neutral-300 pt-1 border-t border-neutral-800/80">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">PARTICIPANT</span>
                    <span className="text-white font-bold">{reg.userName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">RECEIPT #</span>
                    <span className="text-neutral-300">{reg.receiptNumber}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">DAY / VENUE</span>
                    <span className="text-neutral-300">{reg.eventDay} • {reg.eventVenue}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">SQUAD</span>
                    <span className="text-neutral-300">{reg.teamName || 'Individual'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DEDICATED STEP 2: PAYMENT & PROOF VERIFICATION PAGE
  if (step === 'payment') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
        {/* Navigation & Breadcrumbs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setStep('selection');
              setErrorMessage(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-xs font-bold hover:bg-neutral-800 hover:text-white transition-all w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>← BACK TO EVENT SELECTION & DETAILS</span>
          </button>

          {/* Stepper tracker */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => {
                soundFx.playClick();
                setStep('selection');
              }}
              className="flex items-center gap-1.5 text-emerald-400 hover:underline"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>1. Participant & Events</span>
            </button>
            <span className="text-neutral-600">/</span>
            <span className="flex items-center gap-1.5 text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Bank Transfer & Proof</span>
            </span>
          </div>
        </div>

        {/* Page Title & Instruction */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-mono text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DEDICATED PAYMENT CHECKOUT // GOOGLE FORM RESPONSE DISPATCH</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-mono font-black text-white uppercase tracking-tight">
            COMPLETE BANK TRANSFER
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 font-sans">
            Transfer the exact payable amount to the bank account below, enter your bank transaction/reference number, and upload the payment receipt to submit your registration for admin verification.
          </p>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold">{errorMessage}</span>
          </div>
        )}

        {/* Main 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: REGISTRATION SUMMARY & PARTICIPANT RECAP (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Participant Profile Card */}
            <div className="p-5 rounded-2xl bg-[#040f07] border border-emerald-500/30 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PARTICIPANT PROFILE</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setStep('selection');
                  }}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Edit Info
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Name:</span>
                  <span className="font-bold text-white text-right">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Email:</span>
                  <span className="text-emerald-400 text-right truncate max-w-[180px]">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Phone:</span>
                  <span className="text-neutral-200 text-right">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">College:</span>
                  <span className="text-neutral-300 text-right truncate max-w-[180px]">{college}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Dept / Year:</span>
                  <span className="text-neutral-300 text-right">{department} ({collegeYear})</span>
                </div>
              </div>
            </div>

            {/* Selected Events Breakdown Card */}
            <div className="p-5 rounded-2xl bg-[#040f07] border border-emerald-500/30 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-amber-400" />
                  <span>SELECTED EVENTS ({selectedEvents.length})</span>
                </span>
                <span className="text-[10px] text-neutral-400">
                  {selectedEvents.length} Item{selectedEvents.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {selectedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-xl bg-black/60 border border-neutral-800 flex items-start justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">
                        {ev.category} • {ev.day}
                      </span>
                      <span className="font-bold text-white block">{ev.title}</span>
                      {ev.maxTeamSize > 1 && teamDetails[ev.id]?.teamName && (
                        <span className="text-[10px] text-amber-400/90 block">
                          Squad: {teamDetails[ev.id].teamName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white shrink-0">₹{ev.entryFee}</span>
                  </div>
                ))}
              </div>

              {/* Combo Discount Line */}
              {comboDiscount > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between text-xs text-amber-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>COMBO BUNDLE SAVINGS:</span>
                  </span>
                  <span>-₹{comboDiscount}</span>
                </div>
              )}

              {/* Total Summary */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-sm">
                <span className="font-bold text-neutral-300">TOTAL PAYABLE:</span>
                <span className="text-xl font-black text-emerald-400">₹{finalPayableAmount}</span>
              </div>
            </div>

            {/* Google Sheets Sync badge */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs font-mono text-emerald-400">
              <FileSpreadsheet className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>Responses automatically append to master Google Sheet and respective event sheets upon submission.</span>
            </div>
          </div>

          {/* RIGHT COLUMN: BANK DETAILS + PAYMENT PROOF */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmitBatchRegistration} className="p-6 rounded-3xl bg-[#040f07] border-2 border-emerald-500/40 shadow-[0_0_35px_rgba(0,255,102,0.15)] space-y-6">
              {/* STEP 1: BANK TRANSFER DETAILS */}
              <div className="p-5 rounded-2xl bg-[#031407] border border-emerald-600/80 shadow-lg space-y-4 font-mono">
                <div className="flex items-center justify-between border-b border-emerald-900/80 pb-2.5">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-emerald-400" /><span>STEP 1: COMPLETE BANK TRANSFER</span></span>
                  <span className="text-xs font-black text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-700">AMOUNT: ₹{finalPayableAmount}</span>
                </div>
                <div className="rounded-2xl bg-black/70 border border-emerald-900 p-4 space-y-3">
                  <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Payment Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#06130a] border border-emerald-900"><span className="text-[10px] text-neutral-500 block">BANK NAME</span><span className="text-white font-bold">INDIAN BANK</span></div>
                    <div className="p-3 rounded-xl bg-[#06130a] border border-emerald-900"><span className="text-[10px] text-neutral-500 block">ACCOUNT NO</span><span className="text-emerald-300 font-bold select-all">7776750392</span></div>
                    <div className="p-3 rounded-xl bg-[#06130a] border border-emerald-900"><span className="text-[10px] text-neutral-500 block">IFSC CODE</span><span className="text-emerald-300 font-bold select-all">IDIB000S201</span></div>
                    <div className="p-3 rounded-xl bg-[#06130a] border border-emerald-900"><span className="text-[10px] text-neutral-500 block">TOTAL PAYABLE</span><span className="text-amber-400 font-bold">₹{finalPayableAmount}</span></div>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">Transfer the exact amount shown above to the Indian Bank account. After payment, keep your bank transaction/reference number and upload the successful payment receipt below.</p>
              </div>

              {/* STEP 2: SUBMIT TRANSACTION ID & PAYMENT SCREENSHOT */}
              <div className="p-5 rounded-2xl bg-[#020b04] border border-emerald-800/80 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-emerald-900 pb-2.5">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>STEP 2: SUBMIT PAYMENT PROOF RESPONSE</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                    REQUIRED
                  </span>
                </div>

                {/* Transaction ID / UTR Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-emerald-400 font-bold flex items-center justify-between">
                    <span>BANK TRANSACTION / REFERENCE ID *</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Found in bank receipt</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your bank transaction/reference number"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full bg-black border border-emerald-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Payment Screenshot & QR Code Upload Zone */}
                <QRAttachZone
                  value={paymentScreenshot}
                  fileName={screenshotFileName}
                  onChange={(dataUrl, fName) => {
                    setPaymentScreenshot(dataUrl);
                    setScreenshotFileName(fName);
                    setErrorMessage(null);
                  }}
                  onClear={() => {
                    setPaymentScreenshot('');
                    setScreenshotFileName(null);
                  }}
                  label="ATTACH PAYMENT SCREENSHOT / RECEIPT"
                  required={true}
                />
              </div>

              {/* FINAL SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting || selectedEventIds.length === 0}
                className={`w-full py-4 rounded-2xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  selectedEventIds.length > 0 && !isSubmitting
                    ? 'bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(0,255,102,0.4)] cursor-pointer'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>SUBMITTING GOOGLE FORM RESPONSE & MINTING PASSES...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>SUBMIT RESPONSE & MINT {selectedEventIds.length} PASSES (₹{finalPayableAmount})</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-fadeIn">
      {/* Portal Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>OFFICIAL IGNITEX 2026 MULTI-EVENT REGISTRATION MATRIX</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-mono font-black text-white uppercase tracking-tight">
          REGISTER FOR MULTIPLE EVENTS
        </h1>
        <p className="text-xs sm:text-sm text-neutral-300 font-sans">
          Select any combination of Technical and Non-Technical events. Complete a single fast checkout, receive instant QR entry passes, and automatically sync to event-specific Google Sheet tabs.
        </p>
      </div>

      {/* VIP Combo Pass Highlight Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#071d0e] via-[#0b2915] to-[#071d0e] border-2 border-amber-400/60 shadow-[0_0_35px_rgba(251,191,36,0.2)] flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-400 font-mono text-xs font-black uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>₹400 COMBO PASS // SAVE ₹50</span>
          </span>
          <h3 className="text-2xl sm:text-3xl font-mono font-black text-white uppercase">
            EVERY INDIVIDUAL EVENT PASS
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 font-sans max-w-2xl">
            Unlocks Profile Architect, Prompt Perfect and Memergency for just ₹400 instead of ₹450. Instant entry across Day 1 & Day 2!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-center">
          <button
            type="button"
            onClick={selectAllIndividualCombo}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black font-mono text-xs font-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(251,191,36,0.4)] w-full sm:w-auto"
          >
            <Zap className="w-4 h-4 text-black" />
            <span>CLAIM 3-EVENT COMBO (₹400)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Selection Matrix on Left, Cart/Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: EVENTS SELECTOR (8 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Preset Action Buttons & Filter Tabs */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#040f07] border border-neutral-800">
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setCategoryFilter('all'); }}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  ALL ({events.length})
                </button>
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setCategoryFilter('technical'); }}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                    categoryFilter === 'technical'
                      ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  TECHNICAL (5)
                </button>
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setCategoryFilter('non-technical'); }}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                    categoryFilter === 'non-technical'
                      ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  NON-TECHNICAL (4)
                </button>
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setCategoryFilter('selected'); }}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                    categoryFilter === 'selected'
                      ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  SELECTED ({selectedEventIds.length})
                </button>
              </div>

              {/* Clear Button */}
              {selectedEventIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllSelections}
                  className="text-xs font-mono text-rose-400 hover:text-rose-300 underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Quick Bulk Presets Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-neutral-500">Quick Select:</span>
              <button
                type="button"
                onClick={selectAllTechnical}
                className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-emerald-500/20 transition-colors"
              >
                + All 5 Technical
              </button>
              <button
                type="button"
                onClick={selectAllNonTechnical}
                className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-400/20 transition-colors"
              >
                + All 4 Non-Tech
              </button>
              <button
                type="button"
                onClick={selectAllNineEvents}
                className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-purple-400 border border-purple-500/20 transition-colors"
              >
                + All 9 Events
              </button>
            </div>
          </div>

          {/* Events Grid */}
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              const isSelected = selectedEventIds.includes(event.id);
              const isTeam = event.maxTeamSize > 1;

              return (
                <div
                  key={event.id}
                  onClick={() => toggleEventSelection(event)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-[#061a0d] border-emerald-500/80 shadow-[0_0_25px_rgba(0,255,102,0.2)]'
                      : 'bg-[#040e06] border-neutral-800/80 hover:border-emerald-500/40 hover:bg-[#06150a]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox Icon */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(0,255,102,0.5)]'
                          : 'border border-neutral-700 bg-neutral-900/80 group-hover:border-emerald-500/50'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                    </div>

                    {/* Event Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                              event.category === 'technical'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                            }`}
                          >
                            {event.category}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                            {isTeam ? (
                              <Users className="w-3 h-3 text-purple-400" />
                            ) : (
                              <UserIcon className="w-3 h-3 text-blue-400" />
                            )}
                            <span>{event.teamSize}</span>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-mono font-black text-emerald-400">
                            ₹{event.entryFee}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-base sm:text-lg font-mono font-bold text-white uppercase group-hover:text-emerald-300 transition-colors">
                        {event.title}
                      </h4>

                      <p className="text-xs text-neutral-300 font-sans line-clamp-2">
                        {event.shortDescription}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-neutral-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-400" />
                          <span>{event.day}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{event.time}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-yellow-400" />
                          <span>{event.prizePool}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SQUAD / TEAM DETAILS SECTION FOR SELECTED TEAM EVENTS */}
          {selectedEvents.some(e => e.maxTeamSize > 1) && (
            <div className="p-6 rounded-2xl bg-[#051409] border border-purple-500/40 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>SQUAD & TEAM REGISTRATION DETAILS</span>
                </div>
                <h3 className="text-lg font-mono font-black text-white uppercase">
                  TEAM MEMBERS FOR SELECTED EVENTS
                </h3>
                <p className="text-xs text-neutral-300 font-sans">
                  The following selected events allow multi-person squads. Specify your squad name and teammate details below.
                </p>
              </div>

              <div className="space-y-4">
                {selectedEvents
                  .filter(e => e.maxTeamSize > 1)
                  .map((teamEvent) => {
                    const info = teamDetails[teamEvent.id] || { teamName: '', teamMembers: [name || ''] };
                    const squadSize = teamEvent.maxTeamSize;

                    return (
                      <div
                        key={teamEvent.id}
                        className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-700/80 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                            {teamEvent.title} ({teamEvent.teamSize})
                          </span>
                          <span className="text-[10px] font-mono text-purple-400 uppercase">
                            Team Size: {teamEvent.minTeamSize ?? 2}–{squadSize} Members
                          </span>
                        </div>

                        <div>
                          <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                            TEAM / SQUAD NAME *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Cyber Knights / Pixel Warriors"
                            value={info.teamName || ''}
                            onChange={(e) => handleTeamNameChange(teamEvent.id, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* Teammates fields */}
                        <div className="space-y-2 pt-1">
                          <label className="text-[11px] font-mono text-neutral-400 block">
                            SQUAD MEMBERS
                          </label>
                          {Array.from({ length: squadSize }).map((_, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-neutral-500 w-16">
                                {idx === 0 ? 'Leader (You)' : `Member ${idx + 1}`}
                              </span>
                              <input
                                type="text"
                                placeholder={idx === 0 ? (name || 'Participant Name') : `Teammate ${idx + 1} Name`}
                                value={info.teamMembers?.[idx] ?? (idx === 0 ? name : '')}
                                onChange={(e) => handleTeamMemberChange(teamEvent.id, idx, e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-black border border-neutral-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: PARTICIPANT FORM & CHECKOUT DOCK (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6 sticky top-20">
          
          {/* Participant Form Card */}
          <form
            onSubmit={handleProceedToPayment}
            className="p-6 rounded-3xl bg-[#040f07] border border-emerald-500/40 shadow-[0_0_35px_rgba(0,255,102,0.15)] space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                  STEP 1 // PARTICIPANT DETAILS
                </span>
                <h3 className="text-lg font-mono font-black text-white uppercase">
                  ENTER PARTICIPANT INFO
                </h3>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-neutral-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. participant@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-neutral-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                    PHONE / WHATSAPP *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-neutral-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                  COLLEGE / INSTITUTION
                </label>
                <input
                  type="text"
                  placeholder="e.g. Institute of Technology"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-neutral-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                    DEPARTMENT
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE / IT / ECE"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-neutral-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                    YEAR OF STUDY
                  </label>
                  <select
                    value={collegeYear}
                    onChange={(e) => setCollegeYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-neutral-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ORDER SUMMARY CART */}
            <div className="p-4 rounded-2xl bg-black/70 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">SELECTED EVENTS:</span>
                <span className="text-emerald-400 font-bold">{selectedEvents.length} Events</span>
              </div>

              {/* Itemized List */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs font-mono border-t border-b border-neutral-800 py-2">
                {selectedEvents.length === 0 ? (
                  <span className="text-neutral-500 block text-center py-2">No events selected yet. Click event cards on the left to add.</span>
                ) : (
                  selectedEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between text-neutral-300">
                      <span className="truncate max-w-[200px]">{ev.title}</span>
                      <span className="text-neutral-400">₹{ev.entryFee}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Combo Discount Line */}
              {comboDiscount > 0 && (
                <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>COMBO BUNDLE DISCOUNT:</span>
                  </span>
                  <span>-₹{comboDiscount}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex items-center justify-between pt-1 text-sm font-mono font-black text-white">
                <span>TOTAL PAYABLE AMOUNT:</span>
                <span className="text-lg text-emerald-400">₹{finalPayableAmount}</span>
              </div>
            </div>

            {/* SUBMIT BUTTON - PROCEED TO PAYMENT PAGE */}
            <button
              type="submit"
              disabled={selectedEventIds.length === 0}
              className={`w-full py-4 rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                selectedEventIds.length > 0
                  ? 'bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black hover:scale-[1.02] shadow-[0_0_25px_rgba(0,255,102,0.4)] cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>PROCEED TO PAYMENT (₹{finalPayableAmount}) →</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
