import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  CalendarDays,
  MapPin,
  Users,
  ArrowLeft,
  UserCheck,
  LockKeyhole,
  LogOut,
} from 'lucide-react';

const ADMIN_STORAGE_KEY = 'ignitex_admin_key';

type VerifyResponse = {
  valid: boolean;
  status: string;
  message: string;
  registration_number?: string;
  participant?: { name?: string; college?: string; department?: string };
  events?: Array<{ title: string; venue?: string; day?: string }>;
  team?: { name: string; members: string[] } | null;
  checked_in?: boolean;
};

function getStoredAdminKey(): string {
  try {
    return sessionStorage.getItem(ADMIN_STORAGE_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

function saveAdminKey(key: string) {
  try {
    sessionStorage.setItem(ADMIN_STORAGE_KEY, key);
  } catch {
    // Session storage may be unavailable in restricted browsers.
  }
}

function clearAdminKey() {
  try {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

async function parseJson(response: Response): Promise<any> {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { success: false, error: { message: raw || `HTTP ${response.status}` } };
  }
}

export function PublicVerifyPage({ token }: { token: string }) {
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [staffPasscode, setStaffPasscode] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');

  useEffect(() => {
    setAdminKey(getStoredAdminKey());
  }, []);

  const verifyTicket = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/verify-ticket?token=${encodeURIComponent(token)}`, {
        cache: 'no-store',
      });
      const result = await parseJson(response);
      if (!response.ok && result?.status !== 'ALREADY_CHECKED_IN') {
        throw new Error(result?.message || result?.error?.message || `Verification failed (HTTP ${response.status}).`);
      }
      setData(result);
    } catch (e: any) {
      setError(e?.message || 'Unable to verify ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await verifyTicket();
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const authenticateStaff = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const key = staffPasscode.trim();
    if (!key) return;

    setAuthenticating(true);
    setCheckInMessage('');
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ key }),
      });
      const result = await parseJson(response);
      if (!response.ok || result.success !== true) {
        throw new Error(result?.error?.message || 'Invalid admin passkey.');
      }
      saveAdminKey(key);
      setAdminKey(key);
      setStaffPasscode('');
      setShowStaffLogin(false);
      setCheckInMessage('Staff access enabled. You can now check in this participant.');
    } catch (e: any) {
      setCheckInMessage(e?.message || 'Staff authentication failed.');
    } finally {
      setAuthenticating(false);
    }
  };

  const checkInParticipant = async () => {
    if (!data?.registration_number || !adminKey) return;

    setCheckingIn(true);
    setCheckInMessage('Recording campus check-in...');
    try {
      const response = await fetch('/api/attendance/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          verification_code: data.registration_number,
          qr_token: data.registration_number,
          confirm_checkin: true,
          staff_email: 'admin@ignitex.edu',
        }),
      });
      const result = await parseJson(response);
      if (!response.ok || !result.valid) {
        throw new Error(result?.message || result?.error?.message || 'Check-in failed.');
      }
      setData((current) => (current ? { ...current, ...result, checked_in: true } : result));
      setCheckInMessage(result.message || 'Participant checked in successfully.');
    } catch (e: any) {
      setCheckInMessage(e?.message || 'Check-in failed.');
    } finally {
      setCheckingIn(false);
    }
  };

  const signOutStaffMode = () => {
    clearAdminKey();
    setAdminKey('');
    setCheckInMessage('Staff access cleared from this browser tab.');
  };

  const isCheckedIn = Boolean(data?.checked_in || data?.status === 'ALREADY_CHECKED_IN');
  const isApproved = Boolean(data?.valid && data?.status === 'APPROVED');

  return (
    <div className="min-h-screen bg-[#030905] text-neutral-100 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-xl rounded-3xl border border-emerald-900 bg-[#06120a] overflow-hidden shadow-[0_0_50px_rgba(0,255,102,0.12)]">
        <div className="p-5 sm:p-6 border-b border-emerald-950 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-950 border border-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-amber-400 tracking-[.25em]">IGNITEX 2026</p>
            <h1 className="text-xl font-mono font-black">TICKET VERIFICATION</h1>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {loading && (
            <div className="py-12 text-center">
              <Loader2 className="animate-spin mx-auto text-emerald-400" size={40} />
              <p className="mt-4 font-mono text-sm">VERIFYING QR PASS...</p>
            </div>
          )}

          {!loading && error && (
            <div className="py-10 text-center">
              <XCircle className="mx-auto text-red-400" size={48} />
              <p className="mt-4 font-mono">{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div className={`rounded-2xl border p-5 ${data.valid ? 'border-emerald-600 bg-emerald-950/30' : 'border-red-800 bg-red-950/20'}`}>
                <div className="flex gap-3 items-center">
                  {data.valid ? <CheckCircle2 className="text-emerald-400 shrink-0" size={36} /> : <XCircle className="text-red-400 shrink-0" size={36} />}
                  <div>
                    <p className="text-xs font-mono font-bold">{data.status}</p>
                    <h2 className="font-mono font-black text-lg">{data.valid ? (isCheckedIn ? 'CHECKED IN' : 'VALID TICKET') : 'INVALID TICKET'}</h2>
                  </div>
                </div>
                <p className="mt-4 text-sm">{data.message}</p>
              </div>

              {data.participant && (
                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-[10px] text-neutral-500 font-mono">PARTICIPANT</p>
                    <p className="text-lg font-mono font-bold">{data.participant.name}</p>
                    <p className="text-xs text-neutral-400">{data.participant.college}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-emerald-950">
                    <p className="text-[10px] text-neutral-500 font-mono">REGISTRATION NUMBER</p>
                    <p className="font-mono font-black text-emerald-300 break-all">{data.registration_number}</p>
                  </div>

                  {data.events?.length ? (
                    <div>
                      <p className="text-[10px] text-neutral-500 font-mono mb-2">REGISTERED EVENTS</p>
                      {data.events.map((event, index) => (
                        <div key={index} className="p-3 mb-2 rounded-xl border border-emerald-950 bg-black/30">
                          <p className="font-mono font-bold">{event.title}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-neutral-400 mt-2">
                            {event.day && <span className="flex gap-1 items-center"><CalendarDays size={13} />{event.day}</span>}
                            {event.venue && <span className="flex gap-1 items-center"><MapPin size={13} />{event.venue}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {data.team && (
                    <div className="p-4 rounded-xl border border-emerald-950 bg-black/30">
                      <p className="text-[10px] text-neutral-500 font-mono flex gap-1"><Users size={13} />TEAM</p>
                      <p className="font-mono font-bold">{data.team.name}</p>
                      <p className="text-xs text-neutral-400">{data.team.members?.join(' • ')}</p>
                    </div>
                  )}
                </div>
              )}

              {isApproved && !isCheckedIn && (
                <div className="mt-6 rounded-2xl border border-emerald-700 bg-emerald-950/20 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-2"><UserCheck size={15} /> STAFF CHECK-IN</p>
                      <p className="text-[11px] text-neutral-400 mt-1">Authorized event staff can record campus entry.</p>
                    </div>
                    {adminKey && (
                      <button onClick={signOutStaffMode} className="text-[10px] font-mono text-neutral-400 hover:text-white flex items-center gap-1">
                        <LogOut size={13} /> CLEAR
                      </button>
                    )}
                  </div>

                  {!adminKey && !showStaffLogin && (
                    <button
                      onClick={() => setShowStaffLogin(true)}
                      className="w-full p-3 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-300 font-mono text-xs font-black flex items-center justify-center gap-2"
                    >
                      <LockKeyhole size={15} /> ENABLE STAFF CHECK-IN
                    </button>
                  )}

                  {!adminKey && showStaffLogin && (
                    <form onSubmit={authenticateStaff} className="space-y-3">
                      <input
                        autoFocus
                        type="password"
                        value={staffPasscode}
                        onChange={(e) => setStaffPasscode(e.target.value)}
                        placeholder="Admin passkey"
                        className="w-full p-3 rounded-xl bg-black/50 border border-emerald-800 text-white font-mono text-sm outline-none focus:border-emerald-400"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setShowStaffLogin(false)} className="p-3 rounded-xl border border-emerald-900 font-mono text-xs">CANCEL</button>
                        <button disabled={authenticating} type="submit" className="p-3 rounded-xl bg-emerald-500 text-black font-mono text-xs font-black disabled:opacity-50">
                          {authenticating ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
                        </button>
                      </div>
                    </form>
                  )}

                  {adminKey && (
                    <button
                      disabled={checkingIn}
                      onClick={checkInParticipant}
                      className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-500 via-green-600 to-amber-500 text-black font-mono text-sm font-black flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,255,102,0.25)] disabled:opacity-50"
                    >
                      <UserCheck size={18} />
                      {checkingIn ? 'CHECKING IN...' : 'CHECK-IN PARTICIPANT'}
                    </button>
                  )}

                  {checkInMessage && <p className="mt-3 text-xs font-mono text-emerald-300">{checkInMessage}</p>}
                </div>
              )}

              {isCheckedIn && (
                <div className="mt-6 rounded-xl border border-emerald-700 bg-emerald-950/30 p-4 text-center">
                  <p className="font-mono font-black text-emerald-300">CAMPUS ENTRY RECORDED</p>
                  <p className="text-xs text-neutral-400 mt-1">This ticket has already been checked in.</p>
                </div>
              )}
            </>
          )}

          <button onClick={() => { window.location.href = '/'; }} className="mt-7 w-full p-3 rounded-xl border border-emerald-900 font-mono text-xs font-bold flex justify-center gap-2">
            <ArrowLeft size={15} /> OPEN IGNITEX WEBSITE
          </button>
        </div>
      </div>
    </div>
  );
}
