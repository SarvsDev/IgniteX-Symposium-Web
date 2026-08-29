import { createClient } from '@supabase/supabase-js';
import { adminSecrets, supabaseConfig } from '../../lib/serverEnv.js';

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isAdmin(req: any): boolean {
  const { allowed } = adminSecrets();
  const key = text(req.headers?.['x-admin-key']);
  const auth = text(req.headers?.authorization);
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return allowed.has(key) || allowed.has(bearer);
}

function jsonBody(req: any): any {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return typeof req.body === 'string' ? JSON.parse(req.body) : {}; } catch { return {}; }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ valid: false, status: 'ERROR', message: 'Use POST /api/attendance/verify.' });
      return;
    }

    if (!isAdmin(req)) {
      res.status(401).json({ valid: false, status: 'ERROR', message: 'Invalid or missing admin key.' });
      return;
    }

    const { url, serviceRoleKey, configured, missing } = supabaseConfig();
    if (!configured) {
      res.status(503).json({
        valid: false,
        status: 'ERROR',
        message: `Supabase is not configured on Vercel. Missing ${missing.join(' and ')}.`,
      });
      return;
    }

    const client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = jsonBody(req);
    let token = text(body.qr_token || body.qrToken || body.verification_code || body.registrationId);
    const confirmCheckin = Boolean(body.confirm_checkin || body.confirmCheckin);
    if (!token) {
      res.status(400).json({ valid: false, status: 'INVALID', message: 'QR token or verification code is required.' });
      return;
    }

    try {
      if (/^https?:\/\//i.test(token)) {
        const parsed = new URL(token);
        token = parsed.searchParams.get('token') || parsed.searchParams.get('qr_token') || token;
      }
    } catch { /* raw token */ }

    const normalizedToken = token.toUpperCase();
    const { data: reg, error } = await client
      .from('registrations')
      .select('*')
      .eq('registration_number', normalizedToken)
      .limit(1)
      .maybeSingle();

    if (error || !reg) {
      res.json({ valid: false, status: 'INVALID', message: 'Invalid QR pass or verification token.' });
      return;
    }

    const aggregateRes = await client.from('registrations').select('*,participants(*)').eq('id', reg.id).single();
    const { data: links } = await client.from('registration_events').select('event_id,events(*)').eq('registration_id', reg.id);
    const { data: teams } = await client.from('teams').select('*,team_members(*)').eq('registration_id', reg.id);
    const participantRow = aggregateRes.data?.participants;
    const participant = {
      name: participantRow?.full_name,
      college: participantRow?.college,
      department: participantRow?.department,
    };
    const events = (links || []).map((link: any) => {
      const event = Array.isArray(link.events) ? link.events[0] : link.events;
      return { title: event?.title, venue: event?.venue, day: event?.day };
    }).filter((event: any) => event.title);
    const firstTeam = (teams || [])[0];
    const team = firstTeam
      ? { name: firstTeam.team_name, members: (firstTeam.team_members || []).map((member: any) => member.member_name).filter(Boolean) }
      : null;

    if (reg.status === 'CHECKED_IN') {
      res.json({ valid: true, status: 'ALREADY_CHECKED_IN', message: `Already checked in at ${reg.verified_at || 'earlier'}.`, registration_number: reg.registration_number, participant, events, team, checked_in: true });
      return;
    }

    if (reg.status !== 'APPROVED') {
      res.json({ valid: false, status: reg.status === 'REJECTED' ? 'REJECTED' : 'PENDING', message: `Registration is ${reg.status}. Only APPROVED passes can enter campus.`, registration_number: reg.registration_number, participant, events, team, checked_in: false });
      return;
    }

    if (!confirmCheckin) {
      res.json({ valid: true, status: 'APPROVED', message: `QR verified for ${participant.name}. Press CHECK-IN PARTICIPANT to record campus entry.`, registration_number: reg.registration_number, participant, events, team, checked_in: false });
      return;
    }

    const { data: checkinResult, error: checkinError } = await client.rpc('check_in_registration', {
      p_registration_id: reg.id,
      p_staff_id: text(body.staff_id) || null,
      p_staff_email: text(body.staff_email) || 'admin@ignitex.edu',
    });
    if (checkinError) throw checkinError;

    if (checkinResult?.status === 'ALREADY_CHECKED_IN') {
      res.json({ valid: true, status: 'ALREADY_CHECKED_IN', message: `Already checked in at ${checkinResult.checked_in_at || 'earlier'}.`, registration_number: reg.registration_number, participant, events, team, checked_in: true });
      return;
    }

    if (checkinResult?.status !== 'CHECKED_IN') {
      res.json({ valid: false, status: checkinResult?.status || 'ERROR', message: checkinResult?.message || 'Check-in failed.', registration_number: reg.registration_number, participant, events, team, checked_in: false });
      return;
    }

    res.json({ valid: true, status: 'APPROVED', message: `Checked in successfully. Welcome ${participant.name}!`, registration_number: reg.registration_number, participant, events, team, checked_in: true });
  } catch (error: any) {
    console.error('[api/attendance/verify]', error);
    res.status(500).json({ valid: false, status: 'ERROR', message: error?.message || 'Verification failed.' });
  }
}
