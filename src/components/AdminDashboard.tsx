import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Search,
  Filter,
  Download,
  QrCode,
  Trash2,
  RefreshCw,
  BarChart2,
  X,
  AlertCircle,
  UserCheck,
  Crown,
  Database,
  Check,
  Mail,
  Camera,
  Square,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Registration, AdminStats } from '../types';
import { soundFx } from './AudioEffects';
import {
  fetchAdminRegistrations,
  fetchAdminStats,
  approveRegistration,
  rejectRegistration,
  resendRegistrationEmail,
  verifyPassTicket,
  fetchParticipantEventReport,
  fetchEventRegistrationCounts,
  ParticipantEventRow,
  EventCountRow,
  fetchPaymentProof,
  PaymentProofResponse,
} from '../lib/adminService';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');


  const [activeTab, setActiveTab] = useState<'analytics' | 'participants' | 'qrScanner'>('analytics');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [actionNotification, setActionNotification] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [participantEventRows, setParticipantEventRows] = useState<ParticipantEventRow[]>([]);
  const [eventCounts, setEventCounts] = useState<EventCountRow[]>([]);
  const [paymentProof, setPaymentProof] = useState<PaymentProofResponse | null>(null);
  const [paymentProofLoading, setPaymentProofLoading] = useState(false);
  const [paymentProofError, setPaymentProofError] = useState<string | null>(null);

  const [scannerActive, setScannerActive] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const scanFrameRef = React.useRef<number | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  // QR Verification Scanner State
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    status: 'APPROVED' | 'ALREADY_CHECKED_IN' | 'PENDING' | 'REJECTED' | 'INVALID' | 'ERROR';
    message: string;
    participant?: { name?: string; college?: string; department?: string };
    events?: Array<{ title: string; venue?: string; day?: string }>;
    team?: { name: string; members: string[] } | null;
  } | null>(null);

  const loadData = async (key: string) => {
    setLoading(true);
    try {
      const [fetchedStats, fetchedRegs, fetchedParticipantEvents, fetchedEventCounts] = await Promise.all([
        fetchAdminStats(key),
        fetchAdminRegistrations(key, statusFilter),
        fetchParticipantEventReport(key),
        fetchEventRegistrationCounts(key),
      ]);
      if (fetchedStats) setStats(fetchedStats);
      if (fetchedRegs) setRegistrations(fetchedRegs);
      setParticipantEventRows(fetchedParticipantEvents);
      setEventCounts(fetchedEventCounts);
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminKey) {
      loadData(adminKey);
      const interval = setInterval(() => {
        loadData(adminKey);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, adminKey, statusFilter]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputKey = passcode.trim();
    if (!inputKey) {
      soundFx.playAlert();
      alert('Enter the admin passkey.');
      return;
    }
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: inputKey }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || 'Invalid Admin Passkey');
      setAdminKey(inputKey);
      setIsAuthenticated(true);
      soundFx.playSuccess();
      loadData(inputKey);
    } catch (error: any) {
      soundFx.playAlert();
      alert(error?.message || 'Access Denied: Invalid Admin Passkey');
    }
  };

  const handleApprove = async (reg: Registration) => {
    soundFx.playClick();
    setActionNotification(`Approving registration for ${reg.userName}...`);
    const result = await approveRegistration(reg.id, adminKey);
    if (result.success) {
      soundFx.playSuccess();
      setActionNotification(`✓ Approved pass for ${reg.userName}! (${result.verification_code || reg.registrationNumber})`);
      loadData(adminKey);
    } else {
      soundFx.playAlert();
      setActionNotification(`Error: ${result.message}`);
    }
    setTimeout(() => setActionNotification(null), 5000);
  };

  const handleReject = async (reg: Registration) => {
    const reason = prompt(`Enter rejection reason for ${reg.userName}:`, 'Payment unverified or invalid submission.');
    if (!reason) return;

    soundFx.playClick();
    setActionNotification(`Rejecting registration for ${reg.userName}...`);
    const result = await rejectRegistration(reg.id, reason, adminKey);
    if (result.success) {
      soundFx.playSuccess();
      setActionNotification(`Registration for ${reg.userName} has been rejected.`);
      loadData(adminKey);
    } else {
      soundFx.playAlert();
      setActionNotification(`Error: ${result.message}`);
    }
    setTimeout(() => setActionNotification(null), 5000);
  };

  const handleViewPaymentProof = async (reg: Registration) => {
    soundFx.playClick();
    setPaymentProofLoading(true);
    setPaymentProofError(null);
    try {
      const proof = await fetchPaymentProof(reg.id, adminKey);
      setPaymentProof(proof);
    } catch (error: any) {
      soundFx.playAlert();
      setPaymentProofError(error?.message || 'Could not open payment proof.');
    } finally {
      setPaymentProofLoading(false);
    }
  };

  const handleResendEmail = async (reg: Registration) => {
    soundFx.playClick();
    setSendingEmailId(reg.id);
    setActionNotification(`Dispatching pass email to ${reg.userEmail}...`);

    const result = await resendRegistrationEmail(reg.id, adminKey);
    setSendingEmailId(null);
    if (result.success) {
      soundFx.playSuccess();
      setActionNotification(`✓ ${result.message}`);
    } else {
      soundFx.playAlert();
      setActionNotification(`Error: ${result.message}`);
    }
    setTimeout(() => setActionNotification(null), 5000);
  };

  const handleVerifyQR = async (e?: React.FormEvent, valueOverride?: string) => {
    e?.preventDefault();
    const value = (valueOverride || scanInput).trim();
    if (!value) return;

    soundFx.playClick();
    try {
      const data = await verifyPassTicket(value, adminKey, false);
      if (data.status === 'APPROVED') soundFx.playSuccess(); else soundFx.playAlert();
      setScanInput(value);
      setScanResult(data);
    } catch {
      soundFx.playAlert();
      setScanResult({ status: 'ERROR', message: 'Server verification error.' });
    }
  };

  const handleConfirmCheckIn = async () => {
    const value = scanInput.trim();
    if (!value) return;
    soundFx.playClick();
    const data = await verifyPassTicket(value, adminKey, true);
    if (data.status === 'APPROVED' && data.checked_in) soundFx.playSuccess(); else soundFx.playAlert();
    setScanResult(data);
    if (adminKey) loadData(adminKey);
  };

  const stopCameraScanner = () => {
    if (scanFrameRef.current) cancelAnimationFrame(scanFrameRef.current);
    scanFrameRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setScannerActive(false);
  };

  const startCameraScanner = async () => {
    try {
      const Detector = (window as any).BarcodeDetector;
      if (!Detector) {
        alert('QR camera scanning is not supported by this browser. Use Chrome/Edge or the manual scanner field.');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Camera access is unavailable in this browser/context.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setScannerActive(true);
    } catch (error: any) {
      alert(error?.message || 'Could not access the camera. Allow camera permission and try again.');
      stopCameraScanner();
    }
  };

  useEffect(() => {
    if (!scannerActive || !mediaStreamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) return;

    video.srcObject = mediaStreamRef.current;
    let cancelled = false;
    const detector = new Detector({ formats: ['qr_code'] });

    const scan = async () => {
      if (cancelled || !mediaStreamRef.current) return;
      try {
        if (video.readyState >= 2) {
          const codes = await detector.detect(video);
          const value = codes?.[0]?.rawValue;
          if (value) {
            stopCameraScanner();
            setScanInput(value);
            await handleVerifyQR(undefined, value);
            return;
          }
        }
      } catch (error) {
        console.error('QR camera scan failed:', error);
      }
      if (!cancelled) scanFrameRef.current = requestAnimationFrame(scan);
    };

    video.play().catch(() => undefined);
    scanFrameRef.current = requestAnimationFrame(scan);
    return () => {
      cancelled = true;
      if (scanFrameRef.current) cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    };
  }, [scannerActive]);

  useEffect(() => () => stopCameraScanner(), []);

  const exportCSV = () => {
    soundFx.playClick();
    if (registrations.length === 0) return;

    const headers = [
      'Registration ID',
      'Participant Name',
      'Age',
      'Email',
      'Phone',
      'College',
      'Year of College',
      'Event Title',
      'Category',
      'Day',
      'Amount Paid',
      'Gateway',
      'Transaction ID',
      'Payment Status',
      'Attended',
    ];

    const rows = registrations.map((r) => [
      r.id,
      r.registrationNumber || r.ticketHash,
      `"${r.userName}"`,
      r.userAge || '20',
      r.userEmail,
      r.userPhone,
      `"${r.userCollege}"`,
      `"${r.collegeYear || '3rd Year'}"`,
      `"${r.eventTitle}"`,
      r.eventCategory,
      r.eventDay,
      r.amountPaid,
      r.paymentGateway,
      r.transactionId,
      r.paymentStatus,
      r.attended ? 'YES' : 'NO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ignitex_registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ticketHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userCollege.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || r.eventCategory === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Auth Gate Screen
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-md rounded-2xl bg-[#030a05] border border-amber-500/50 p-6 text-center space-y-6 shadow-[0_0_35px_rgba(234,179,8,0.25)]">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#08150c] border border-emerald-900 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-full bg-amber-950 border border-amber-500/80 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <Crown className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-xl font-mono font-bold text-white uppercase">
              IGNITEX ADMIN GATE
            </h2>
            <p className="text-xs font-mono text-emerald-400 mt-1">
              Role-Based IgniteX Admin Authentication
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-mono text-emerald-400 block mb-1">
                Admin Passkey Required
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Admin Passkey"
                className="w-full bg-[#06120a] border border-emerald-900 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black font-mono text-xs font-extrabold transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              AUTHENTICATE COMMANDER
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="admin-dashboard-shell relative w-full max-w-[1500px] max-h-[94vh] overflow-y-auto rounded-2xl lg:rounded-3xl bg-[#030a05]/95 border border-emerald-800/90 shadow-[0_25px_100px_rgba(0,0,0,0.65),0_0_45px_rgba(16,185,129,0.08)] p-4 sm:p-5 lg:p-7 text-left space-y-5 lg:space-y-6">
        
        {/* Top Control Bar */}
        <div className="admin-topbar flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-emerald-900/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-mono font-black text-white uppercase">
                IGNITEX COMMANDER PORTAL
              </h2>
              <p className="text-xs font-mono text-emerald-400">
                Live Registration Audit & Attendance Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700 font-mono text-[11px] text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE DATABASE</span>
            </div>

            <button
              onClick={() => loadData(adminKey)}
              title="Manual Refresh"
              className="p-2 rounded-xl bg-[#08150c] border border-emerald-900 text-emerald-300 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportCSV}
              title="Export Event Pass Receipts CSV"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#08150c] border border-emerald-900 text-xs font-mono text-emerald-300 hover:text-white"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <a
              href="/api/admin/database/export"
              download="symposium.db"
              title="Download SQLite Database Backup (.db file)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs font-mono text-emerald-300 hover:text-white hover:bg-emerald-900 transition-all"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Backup .db</span>
            </a>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-[#08150c] border border-emerald-900 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="admin-tabs flex items-center gap-2 border-b border-emerald-900/80 pb-3 font-mono text-xs overflow-x-auto">
          {[
            { id: 'analytics', label: 'Analytics Overview', icon: BarChart2 },
            { id: 'participants', label: `Registrations (${registrations.length})`, icon: Users },
            { id: 'qrScanner', label: 'Gate Ticket Scanner', icon: QrCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  active
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-600 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'text-neutral-400 hover:text-white hover:bg-[#08150c]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* KPI Strip */}
        {stats && (
          <div className="admin-kpi-grid grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#06120a] border border-emerald-900">
              <span className="text-[10px] font-mono text-emerald-500/80 block mb-0.5">TOTAL REGISTRATIONS</span>
              <div className="text-xl font-mono font-bold text-white">{stats.totalRegistrations}</div>
              <div className="text-[10px] font-mono text-emerald-400/80 mt-1">
                Day 1: {stats.day1Count} | Day 2: {stats.day2Count}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#06120a] border border-emerald-900">
              <span className="text-[10px] font-mono text-emerald-500/80 block mb-0.5">TOTAL REVENUE</span>
              <div className="text-xl font-mono font-bold text-emerald-400">₹{stats.totalRevenue}</div>
              <div className="text-[10px] font-mono text-emerald-500/80 mt-1">Via Verified Bank Transfer</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#06120a] border border-emerald-900">
              <span className="text-[10px] font-mono text-emerald-500/80 block mb-0.5">CHECKED-IN ATTENDEES</span>
              <div className="text-xl font-mono font-bold text-amber-400">{stats.totalAttendees}</div>
              <div className="text-[10px] font-mono text-emerald-500/80 mt-1">
                {stats.totalRegistrations > 0
                  ? `${Math.round((stats.totalAttendees / stats.totalRegistrations) * 100)}% Turnout`
                  : '0% Turnout'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#06120a] border border-emerald-900">
              <span className="text-[10px] font-mono text-emerald-500/80 block mb-0.5">CATEGORY RATIO</span>
              <div className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400">{stats.techRegistrations} Tech</span>
                <span>/</span>
                <span className="text-amber-400">{stats.nonTechRegistrations} Non-Tech</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: ANALYTICS OVERVIEW */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Event Revenue Bar Chart */}
              <div className="lg:col-span-8 p-4 rounded-xl bg-[#06120a] border border-emerald-900 space-y-3">
                <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  EVENT POPULARITY & REVENUE (₹)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.eventsPopularity}>
                      <XAxis dataKey="eventTitle" stroke="#10b981" fontSize={10} tickLine={false} />
                      <YAxis stroke="#10b981" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#020703', borderColor: '#10b981', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart Distribution */}
              <div className="lg:col-span-4 p-4 rounded-xl bg-[#06120a] border border-emerald-900 space-y-3">
                <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  CATEGORY REGISTRATIONS
                </h3>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Technical', value: stats.techRegistrations },
                          { name: 'Non-Technical', value: stats.nonTechRegistrations },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#eab308" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#020703', borderColor: '#10b981', fontSize: '11px', fontFamily: 'monospace' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            <div className="rounded-xl bg-[#06120a] border border-emerald-900 overflow-hidden">
              <div className="p-4 border-b border-emerald-900">
                <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase">EVENT REGISTRATION COUNTS</h3>
                <p className="text-[10px] text-neutral-500 font-mono mt-1">Every registered event contributes exactly +1 to its event counter.</p>
              </div>
              <div className="admin-table-shell overflow-auto">
                <table className="responsive-admin-table admin-count-table w-full text-left text-[11px] font-mono">
                  <thead className="bg-[#020703] text-emerald-500 uppercase">
                    <tr><th className="p-3">Event</th><th className="p-3">Registered</th><th className="p-3">Approved</th><th className="p-3">Checked In</th><th className="p-3">Capacity</th></tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950">
                    {eventCounts.map((row) => (
                      <tr key={row.event_id} className="hover:bg-[#06150a]">
                        <td data-label="Event" className="p-3 text-white font-bold">{row.events?.title || row.event_id}</td>
                        <td data-label="Registered" className="p-3 text-amber-400 font-bold">{row.registered_count}</td>
                        <td data-label="Approved" className="p-3 text-emerald-300">{row.approved_count}</td>
                        <td data-label="Checked In" className="p-3 text-emerald-400">{row.checked_in_count}</td>
                        <td data-label="Capacity" className="p-3 text-neutral-400">{row.events?.max_capacity ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARTICIPANTS TABLE */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#06120a] border border-emerald-900 overflow-hidden">
              <div className="p-4 border-b border-emerald-900 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase">TRANSPARENT PARTICIPANT → EVENT REGISTER</h3>
                  <p className="text-[10px] text-neutral-500 font-mono mt-1">Plain participant, event, team and member details for admin reporting. One row per event registration.</p>
                </div>
                <span className="text-[10px] font-mono text-amber-400">{participantEventRows.length} EVENT REGISTRATIONS</span>
              </div>
              <div className="admin-report-table-shell max-h-80 overflow-auto">
                <table className="responsive-admin-table admin-report-table w-full text-left text-[11px] font-mono">
                  <thead className="sticky top-0 bg-[#020703] text-emerald-500 uppercase">
                    <tr><th className="p-3">IGX ID</th><th className="p-3">Participant Name</th><th className="p-3">Event Name</th><th className="p-3">Team / Members</th><th className="p-3">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950">
                    {participantEventRows.map((row, index) => (
                      <tr key={`${row.registration_number}-${row.event_name}-${index}`} className="hover:bg-[#06150a]">
                        <td data-label="IGX ID" className="p-3 text-amber-400 font-bold">{row.registration_number}</td>
                        <td data-label="Participant" className="p-3 text-white font-bold">{row.participant_name}</td>
                        <td data-label="Event" className="p-3 text-emerald-300">{row.event_name}</td>
                        <td data-label="Team / Members" className="p-3 min-w-[220px]">{row.team_name ? <><div className="text-white font-bold">{row.team_name}</div><div className="text-[10px] text-emerald-300 mt-1">{(row.team_members || []).map((m, i) => <div key={`${row.registration_number}-${i}`}>• {m}</div>)}</div></> : <span className="text-neutral-500">SOLO</span>}</td>
                        <td data-label="Status" className="p-3 text-neutral-400">{row.registration_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Feedback Notification */}
            {actionNotification && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-mono text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">{actionNotification}</span>
              </div>
            )}

            {/* Search & Filter Bar */}
            <div className="admin-filter-bar flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#06120a]/70 border border-emerald-900/70">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, email, ID, ticket..."
                  className="w-full bg-[#06120a] border border-emerald-900 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#06120a] border border-emerald-900 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-300"
                >
                  <option value="all">All Categories</option>
                  <option value="technical">Technical</option>
                  <option value="non-technical">Non-Technical</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#06120a] border border-emerald-900 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="APPROVED">Approved / Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CHECKED_IN">Checked In</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="admin-table-shell overflow-auto rounded-2xl border border-emerald-900/80 bg-[#020703]/50 shadow-inner shadow-emerald-950/20">
              <table className="responsive-admin-table admin-registration-table w-full text-left font-mono text-xs">
                <thead className="bg-[#06120a] text-emerald-400 border-b border-emerald-900">
                  <tr>
                    <th className="p-3">Registration ID</th>
                    <th className="p-3">Participant</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Team / Members</th>
                    <th className="p-3">College</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Attended</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950 bg-[#020703] text-neutral-300">
                  {filteredRegistrations.map((reg) => {
                    const isPaid = reg.paymentStatus === 'SUCCESS' || reg.paymentStatus === 'PAID';
                    return (
                      <tr key={reg.id} className="hover:bg-[#06150a] transition-colors">
                        <td data-label="Registration ID" className="p-3">
                          <div className="font-bold text-amber-400">{reg.registrationNumber || reg.ticketHash}</div>
                        </td>
                        <td data-label="Participant" className="p-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{reg.userName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              {reg.userAge || '20'} yrs
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-500/80">{reg.userEmail}</div>
                          <div className="text-[10px] text-amber-400 font-mono">{reg.userPhone}</div>
                        </td>
                        <td data-label="Event" className="p-3">
                          <div className="truncate max-w-[150px] font-bold">{reg.eventTitle}</div>
                          <div className="text-[10px] text-emerald-500/80">{reg.eventDay}</div>
                        </td>
                        <td data-label="Team / Members" className="p-3 min-w-[210px]">
                          {reg.teams && reg.teams.length > 0 ? (
                            <div className="space-y-2">
                              {reg.teams.map((team, teamIndex) => (
                                <div key={`${reg.id}-team-${teamIndex}`} className="rounded-lg border border-emerald-900 bg-[#041008] p-2">
                                  <div className="text-[10px] text-amber-400 font-bold uppercase">{team.eventTitle || 'Team Event'}</div>
                                  <div className="text-white font-bold mt-0.5">{team.teamName || 'Unnamed Team'}</div>
                                  <div className="text-[10px] text-emerald-300 mt-1 leading-4">
                                    {(team.members || []).length > 0
                                      ? team.members.map((member, memberIndex) => <div key={`${reg.id}-${teamIndex}-${memberIndex}`}>• {member}</div>)
                                      : '• No member details'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[10px] text-neutral-500">SOLO REGISTRATION</div>
                          )}
                        </td>
                        <td data-label="College" className="p-3">
                          <div className="truncate max-w-[130px]">{reg.userCollege}</div>
                          <div className="text-[10px] text-amber-400 font-semibold">{reg.collegeYear || '3rd Year'}</div>
                        </td>
                        <td data-label="Amount" className="p-3 font-bold text-emerald-400">₹{reg.amountPaid}</td>
                        <td data-label="Status" className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isPaid
                                ? 'bg-emerald-950/90 text-emerald-400 border-emerald-700'
                                : reg.paymentStatus === 'REFUNDED'
                                ? 'bg-red-950/90 text-red-400 border-red-700'
                                : 'bg-amber-950/90 text-amber-400 border-amber-700'
                            }`}
                          >
                            {isPaid ? '✓ APPROVED' : reg.paymentStatus}
                          </span>
                        </td>
                        <td data-label="Attended" className="p-3">
                          <span
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${
                              reg.attended
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700 font-bold'
                                : 'bg-[#06120a] text-neutral-400 border border-emerald-950'
                            }`}
                          >
                            {reg.attended ? (
                              <>
                                <UserCheck className="w-3 h-3 text-emerald-400" />
                                <span>CHECKED IN</span>
                              </>
                            ) : (
                              <span>NOT YET</span>
                            )}
                          </span>
                        </td>
                        <td data-label="Actions" className="p-3 text-right">
                          <div className="admin-action-buttons flex items-center justify-end gap-1.5">
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => handleApprove(reg)}
                                title="Approve Registration"
                                className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1 text-[10px] font-bold"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Approve</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleViewPaymentProof(reg)}
                              title="View uploaded payment proof"
                              className="px-2 py-1 rounded bg-[#08150c] hover:bg-emerald-950 border border-emerald-900 text-amber-400 transition-all flex items-center gap-1 text-[10px] font-bold"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Proof</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResendEmail(reg)}
                              disabled={sendingEmailId === reg.id}
                              title="Resend Pass Email"
                              className="px-2 py-1 rounded bg-[#08150c] hover:bg-emerald-950 border border-emerald-900 text-emerald-400 transition-all flex items-center gap-1 text-[10px] font-bold disabled:opacity-50"
                            >
                              <Mail className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{sendingEmailId === reg.id ? 'Sending...' : 'Pass'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReject(reg)}
                              title="Reject Registration"
                              className="p-1 rounded hover:bg-red-950/80 text-neutral-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: GATE QR TICKET SCANNER */}
        {activeTab === 'qrScanner' && (
          <div className="p-6 rounded-xl bg-[#06120a] border border-emerald-900 space-y-6 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,255,102,0.4)]">
                <QrCode className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-mono font-bold text-white uppercase">
                  IGNITEX GATE ENTRANCE SCANNER
                </h3>
                <p className="text-xs font-mono text-emerald-400 mt-1">
                  Scan the participant QR pass first. Verification is separate from the final campus check-in.
                </p>
              </div>

              {scannerActive && (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500 bg-black">
                  <video ref={videoRef} className="w-full aspect-video object-cover" muted playsInline />
                  <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-xl pointer-events-none" />
                  <button type="button" onClick={stopCameraScanner} className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-black/80 border border-red-500 text-red-400 font-mono text-xs">Stop Camera</button>
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={scannerActive ? stopCameraScanner : startCameraScanner} className="flex-1 px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono text-xs font-black flex items-center justify-center gap-2">
                  {scannerActive ? <Square className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  {scannerActive ? 'STOP QR CAMERA' : 'SCAN QR WITH CAMERA'}
                </button>
              </div>

              <form onSubmit={handleVerifyQR} className="flex items-center gap-2">
                <input type="text" required value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="Or paste QR token / IGX-XXXX..." className="flex-1 bg-[#020703] border border-emerald-900 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400" />
                <button type="submit" className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black font-mono text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]">Verify</button>
              </form>

              {scanResult?.status === 'APPROVED' && !scanResult.checked_in && (
                <button type="button" onClick={handleConfirmCheckIn} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-mono text-sm font-black shadow-[0_0_25px_rgba(0,255,102,0.35)] flex items-center justify-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  CHECK-IN PARTICIPANT
                </button>
              )}

              {/* Scan Result Feedback */}
              {scanResult && (
                <div
                  className={`p-4 rounded-xl border font-mono text-xs text-left space-y-2 animate-fadeIn ${
                    scanResult.status === 'APPROVED'
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                      : scanResult.status === 'ALREADY_CHECKED_IN'
                      ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                      : 'bg-red-950/90 border-red-500 text-red-300'
                  }`}
                >
                  <div className="font-bold text-sm uppercase flex items-center gap-2">
                    {scanResult.status === 'APPROVED' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    )}
                    <span>STATUS: {scanResult.status}</span>
                  </div>
                  <p>{scanResult.message}</p>

                  {scanResult.participant && (
                    <div className="pt-2 border-t border-emerald-900 text-[11px] space-y-1">
                      <div>Participant: <strong>{scanResult.participant.name}</strong></div>
                      <div>College: <strong>{scanResult.participant.college}</strong></div>
                    </div>
                  )}

                  {scanResult.events && scanResult.events.length > 0 && (
                    <div className="text-[11px] text-emerald-400">
                      Events: {scanResult.events.map((e) => e.title).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}


        {paymentProof && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[92vh] overflow-auto rounded-2xl bg-[#030a05] border border-emerald-700 shadow-2xl p-5">
              <button
                type="button"
                onClick={() => setPaymentProof(null)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-[#08150c] border border-emerald-900 text-neutral-400 hover:text-white"
                aria-label="Close payment proof"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="pr-10 mb-4">
                <div className="text-[10px] font-mono font-bold text-amber-400 uppercase">PAYMENT PROOF</div>
                <h3 className="text-lg font-mono font-black text-white">{paymentProof.registration_number}</h3>
                <p className="text-[10px] font-mono text-neutral-500 mt-1">
                  {paymentProof.original_file_name || 'Uploaded payment receipt'} • {Math.max(1, Math.round(paymentProof.file_size_bytes / 1024))} KB • {paymentProof.status}
                </p>
              </div>
              <div className="rounded-xl bg-black border border-emerald-950 overflow-hidden min-h-[300px] flex items-center justify-center">
                {paymentProof.mime_type === 'application/pdf' ? (
                  <iframe src={paymentProof.signed_url} title="Payment proof" className="w-full h-[70vh]" />
                ) : (
                  <img src={paymentProof.signed_url} alt="Uploaded payment proof" className="max-w-full max-h-[70vh] object-contain" />
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <a href={paymentProof.signed_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-xs font-bold flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Open Full Size
                </a>
                <button type="button" onClick={() => setPaymentProof(null)} className="px-4 py-2 rounded-xl bg-[#08150c] border border-emerald-900 text-neutral-300 font-mono text-xs font-bold">Close</button>
              </div>
            </div>
          </div>
        )}

        {paymentProofLoading && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="px-5 py-4 rounded-xl bg-[#06120a] border border-emerald-700 text-emerald-300 font-mono text-xs">Loading payment proof...</div>
          </div>
        )}

        {paymentProofError && (
          <div className="fixed bottom-5 right-5 z-[90] max-w-sm p-4 rounded-xl bg-red-950 border border-red-700 text-red-300 font-mono text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{paymentProofError}</span>
            <button type="button" onClick={() => setPaymentProofError(null)} className="ml-auto text-red-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        )}

      </div>
    </div>
  );
};
