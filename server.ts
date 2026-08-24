import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { Resend } from 'resend';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import { EVENTS_DATA } from './src/data/eventsData';
import { Registration, AdminStats, VerificationResponse } from './src/types';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MAX_BODY = '32mb';

app.use(express.json({ limit: MAX_BODY }));
app.use(express.urlencoded({ limit: MAX_BODY, extended: true }));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || '';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'doomsday_admin_2026';
const LEGACY_ADMIN_KEY = '8f497bab15055497e0e870561ab2706b';

const supabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY &&
  SUPABASE_URL.startsWith('http') &&
  !SUPABASE_URL.includes('YOUR_PROJECT')
);

let supabaseAdmin: SupabaseClient | null = null;
if (supabaseConfigured) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

function serverConfigError(): string | null {
  if (!SUPABASE_URL) return 'SUPABASE_URL is missing.';
  if (!SUPABASE_SERVICE_ROLE_KEY) return 'SUPABASE_SERVICE_ROLE_KEY is missing.';
  return null;
}

function requireSupabase(res: Response): SupabaseClient | null {
  if (!supabaseAdmin) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: `Supabase server configuration is missing. ${serverConfigError() || 'Check your environment variables.'}`,
      },
    });
    return null;
  }
  return supabaseAdmin;
}

function isAuthorizedAdmin(req: Request): boolean {
  const key = String(req.headers['x-admin-key'] || '').trim();
  const auth = String(req.headers.authorization || '').trim();
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return Boolean(
    key && (key === ADMIN_SECRET_KEY || key === LEGACY_ADMIN_KEY) ||
    bearer && (bearer === ADMIN_SECRET_KEY || bearer === LEGACY_ADMIN_KEY)
  );
}

function requireAdmin(req: Request, res: Response): boolean {
  if (!isAuthorizedAdmin(req)) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or missing admin key.' },
    });
    return false;
  }
  return true;
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateVerificationCode(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(8);
  let value = '';
  for (let i = 0; i < bytes.length; i++) value += alphabet[bytes[i] % alphabet.length];
  return `IGN-2026-${value.slice(0, 4)}-${value.slice(4, 8)}`;
}

function generateQrToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function toLegacyRegistration(row: any, events: any[], teams: any[] = [], members: any[] = []): Registration {
  const firstEvent = events[0] || {};
  const team = teams[0];
  const teamMembers = team ? members.filter((m) => m.team_id === team.id).map((m) => m.member_name) : undefined;
  return {
    id: row.id,
    ticketHash: row.verification_code || `PENDING-${row.registration_number}`,
    registrationNumber: row.registration_number,
    receiptNumber: row.receipt_number || `RCPT-${row.registration_number.replace(/^REG-2026-/, '').replace(/^IGX-/, '')}`,
    userId: row.participant_id,
    userName: row.participants?.full_name || '',
    userAge: row.participants?.age != null ? String(row.participants.age) : undefined,
    userEmail: row.participants?.email || '',
    userPhone: row.participants?.phone || '',
    userCollege: row.participants?.college || '',
    department: row.participants?.department || undefined,
    collegeYear: row.participants?.college_year || undefined,
    eventId: firstEvent.slug || firstEvent.id || '',
    eventTitle: events.map((e) => e.title).join(' + ') || 'IgniteX Event',
    eventCategory: firstEvent.category || 'technical',
    eventDay: firstEvent.day || 'Day 1',
    eventTime: firstEvent.time_display || '10:00 AM - 01:00 PM',
    eventVenue: firstEvent.venue || 'Main Campus',
    teamName: team?.team_name,
    teamMembers,
    amountPaid: Number(row.payment_amount || 0),
    paymentGateway: row.payment_gateway || 'UPI',
    transactionId: row.transaction_id || '',
    paymentScreenshot: row.payment_screenshot_url || undefined,
    registeredAt: row.submitted_at || row.created_at,
    paymentStatus: row.payment_status === 'VERIFIED' || row.status === 'APPROVED' || row.status === 'CHECKED_IN' ? 'SUCCESS' : row.status === 'REJECTED' ? 'REFUNDED' : 'PENDING',
    attended: row.status === 'CHECKED_IN' || Boolean(row.verified_at),
    scannedAt: row.verified_at || undefined,
  };
}

async function getRegistrationAggregate(client: SupabaseClient, registrationId: string) {
  const { data: reg, error: regError } = await client
    .from('registrations')
    .select(`*, participants(*)`)
    .eq('id', registrationId)
    .single();
  if (regError || !reg) throw regError || new Error('Registration not found');

  const { data: links, error: linkError } = await client
    .from('registration_events')
    .select(`price_at_registration,event_id,events(*)`)
    .eq('registration_id', registrationId);
  if (linkError) throw linkError;

  const eventIds = (links || []).map((x: any) => x.event_id);
  const { data: teams, error: teamsError } = await client
    .from('teams')
    .select('*')
    .eq('registration_id', registrationId);
  if (teamsError) throw teamsError;

  const teamIds = (teams || []).map((t: any) => t.id);
  let members: any[] = [];
  if (teamIds.length) {
    const { data, error } = await client.from('team_members').select('*').in('team_id', teamIds);
    if (error) throw error;
    members = data || [];
  }

  return { reg, links: links || [], events: (links || []).map((x: any) => x.events).filter(Boolean), teams: teams || [], members, eventIds };
}

function parseDataUrl(input: string): { buffer: Buffer; mime: string; extension: string } | null {
  const match = input.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  const mime = match[1];
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) return null;
  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  return { buffer: Buffer.from(match[2], 'base64'), mime, extension };
}

async function uploadPaymentProof(
  client: SupabaseClient,
  dataUrl: string,
  registrationId: string,
  registrationNumber: string,
  originalFileName?: string,
  transactionId?: string,
): Promise<{ path: string; mime: string; size: number } | null> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed || parsed.buffer.length > 20 * 1024 * 1024) return null;
  const pathName = `${registrationNumber}/payment-proof.${parsed.extension}`;
  const { error } = await client.storage.from('payment-proofs').upload(pathName, parsed.buffer, {
    contentType: parsed.mime,
    upsert: true,
  });
  if (error) {
    console.warn('[Supabase Storage] payment proof upload failed:', error.message);
    return null;
  }
  const { error: dbError } = await client.from('payment_proofs').upsert({
    registration_id: registrationId,
    registration_number: registrationNumber,
    storage_bucket: 'payment-proofs',
    storage_path: pathName,
    original_file_name: originalFileName || null,
    mime_type: parsed.mime,
    file_size_bytes: parsed.buffer.length,
    transaction_id: transactionId || null,
    status: 'PENDING',
    uploaded_at: new Date().toISOString(),
  }, { onConflict: 'registration_id' });
  if (dbError) {
    console.warn('[Supabase DB] payment proof metadata insert failed:', dbError.message);
    await client.storage.from('payment-proofs').remove([pathName]);
    return null;
  }
  return { path: pathName, mime: parsed.mime, size: parsed.buffer.length };
}

const registrationSchema = z.object({
  participant: z.object({
    full_name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8),
    age: z.union([z.number(), z.string()]).optional(),
    college: z.string().min(2),
    department: z.string().optional(),
    college_year: z.string().optional(),
  }),
  selected_events: z.array(z.object({ event_id: z.string().min(1) })).min(1),
  teams: z.array(z.object({
    event_id: z.string().min(1),
    team_name: z.string().min(1),
    members: z.array(z.object({ name: z.string().min(1), email: z.string().email().optional(), phone: z.string().optional() })).optional().default([]),
  })).optional().default([]),
  payment: z.object({
    transaction_id: z.string().optional(),
    payment_screenshot_url: z.string().optional(),
    payment_screenshot_name: z.string().optional(),
    payment_gateway: z.string().optional(),
  }).default({}),
});

app.get('/api/health', async (_req, res) => {
  const configError = serverConfigError();
  if (!supabaseAdmin) {
    res.status(503).json({ status: 'degraded', database: 'not_configured', resend: Boolean(resend), error: configError });
    return;
  }
  const { error } = await supabaseAdmin.from('events').select('id').limit(1);
  res.status(error ? 503 : 200).json({
    status: error ? 'degraded' : 'ok',
    database: error ? 'error' : 'supabase',
    resend: Boolean(resend),
    error: error?.message || null,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/events', async (_req, res) => {
  const client = requireSupabase(res); if (!client) return;
  try {
    const { data, error } = await client.from('events').select('*').eq('is_active', true).order('day').order('title');
    if (error) throw error;
    const events = (data || []).map((e: any) => ({
      id: e.slug,
      title: e.title,
      tagline: e.tagline || '',
      category: e.category,
      day: e.day,
      time: e.time_display || '',
      venue: e.venue,
      teamSize: e.is_team_event ? `Team of ${e.max_team_size} Members` : 'Individual',
      maxTeamSize: e.max_team_size,
      entryFee: Number(e.entry_fee),
      prizePool: e.prize_pool || '',
      shortDescription: e.description || '',
      fullDescription: e.description || '',
      rules: Array.isArray(e.rules) ? e.rules : [],
      coordinators: Array.isArray(e.coordinators) ? e.coordinators : [],
      slotsTotal: e.max_capacity,
      slotsFilled: e.current_capacity || 0,
      iconName: e.icon_name || 'Code',
    }));
    res.json({ success: true, events });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'EVENTS_FETCH_FAILED', message: error.message } });
  }
});

app.post('/api/register', async (req, res) => {
  const client = requireSupabase(res); if (!client) return;
  try {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues.map((i) => i.message).join(', ') } });
      return;
    }

    const body = parsed.data;
    const email = normalizeEmail(body.participant.email);
    const slugs = [...new Set(body.selected_events.map((e) => e.event_id))];

    const { data: events, error: eventsError } = await client.from('events').select('*').in('slug', slugs).eq('is_active', true);
    if (eventsError) throw eventsError;
    if (!events || events.length !== slugs.length) {
      res.status(400).json({ success: false, error: { code: 'INVALID_EVENTS', message: 'One or more selected events are unavailable.' } });
      return;
    }

    // Validate team payload before creating any registration rows.
    for (const event of events) {
      if (!event.is_team_event) continue;
      const team = body.teams.find((t) => t.event_id === event.slug);
      if (!team) {
        res.status(400).json({ success: false, error: { code: 'TEAM_REQUIRED', message: `Team details are required for ${event.title}.` } });
        return;
      }
      const uniqueNames = new Set([body.participant.full_name.trim().toLowerCase(), ...(team.members || []).map((m) => m.name.trim().toLowerCase()).filter(Boolean)]);
      if (uniqueNames.size < event.min_team_size || uniqueNames.size > event.max_team_size) {
        res.status(400).json({ success: false, error: { code: 'INVALID_TEAM_SIZE', message: `${event.title} requires ${event.min_team_size}-${event.max_team_size} unique members.` } });
        return;
      }
    }

    const { data: existingParticipant } = await client.from('participants').select('*').ilike('email', email).maybeSingle();
    let participantId = existingParticipant?.id;

    if (!participantId) {
      const { data: created, error } = await client.from('participants').insert({
        full_name: body.participant.full_name.trim(),
        email,
        phone: body.participant.phone.trim(),
        age: body.participant.age ? Number(body.participant.age) || null : null,
        college: body.participant.college.trim(),
        department: body.participant.department?.trim() || null,
        college_year: body.participant.college_year?.trim() || null,
      }).select().single();
      if (error) throw error;
      participantId = created.id;
    } else {
      const { error } = await client.from('participants').update({
        full_name: body.participant.full_name.trim(),
        phone: body.participant.phone.trim(),
        age: body.participant.age ? Number(body.participant.age) || null : null,
        college: body.participant.college.trim(),
        department: body.participant.department?.trim() || null,
        college_year: body.participant.college_year?.trim() || null,
      }).eq('id', participantId);
      if (error) throw error;
    }

    const { data: oldLinks } = await client
      .from('registration_events')
      .select('registration_id,event_id,registrations!inner(participant_id,status)')
      .in('event_id', events.map((e: any) => e.id))
      .eq('registrations.participant_id', participantId);

    if (oldLinks && oldLinks.length) {
      const active = oldLinks.filter((x: any) => ['PENDING', 'APPROVED', 'CHECKED_IN'].includes(x.registrations?.status));
      if (active.length) {
        res.status(409).json({ success: false, error: { code: 'REGISTRATION_ALREADY_EXISTS', message: 'You are already registered for one or more selected events.' } });
        return;
      }
    }

    const individualComboSlugs = new Set(['tech-profile-architect', 'tech-neural-rush', 'nontech-prompt-perfect', 'nontech-memergency']);
    const isIndividualCombo = events.length === 4 && events.every((e: any) => individualComboSlugs.has(e.slug));
    const totalAmount = isIndividualCombo ? 500 : events.reduce((sum: number, e: any) => sum + Number(e.entry_fee || 0), 0);
    const { data: generatedNumber, error: numberError } = await client.rpc('generate_next_registration_number');
    if (numberError || !generatedNumber) throw numberError || new Error('Could not generate registration number. Run the Supabase migration first.');
    const { data: registration, error: regError } = await client.from('registrations').insert({
      registration_number: generatedNumber,
      participant_id: participantId,
      status: 'PENDING',
      payment_status: body.payment.transaction_id ? 'SUBMITTED' : 'PENDING',
      payment_amount: totalAmount,
      payment_gateway: body.payment.payment_gateway || 'UPI',
      transaction_id: body.payment.transaction_id?.trim() || null,
      registration_source: 'website',
      metadata: { selected_event_slugs: slugs },
    }).select('*,participants(*)').single();
    if (regError) throw regError;

    const receiptNumber = `RCPT-${registration.registration_number.replace('REG-', '')}`;
    const { error: receiptError } = await client.from('registrations').update({ receipt_number: receiptNumber }).eq('id', registration.id);
    if (receiptError) throw receiptError;

    const eventRows = events.map((e: any) => ({
      registration_id: registration.id,
      event_id: e.id,
      price_at_registration: Number(e.entry_fee || 0),
    }));
    const { error: linkError } = await client.from('registration_events').insert(eventRows);
    if (linkError) throw linkError;

    for (const event of events) {
      if (!event.is_team_event) continue;
      const team = body.teams.find((t) => t.event_id === event.slug)!;
      const memberRows = team.members || [];
      const { data: createdTeam, error: teamError } = await client.from('teams').insert({
        registration_id: registration.id,
        event_id: event.id,
        team_name: team.team_name.trim(),
        team_leader_participant_id: participantId,
      }).select().single();
      if (teamError) throw teamError;
      const members = [{ member_name: body.participant.full_name.trim(), member_email: email, member_phone: body.participant.phone.trim(), participant_id: participantId, is_leader: true }, ...memberRows.filter((m) => m.name.trim().toLowerCase() !== body.participant.full_name.trim().toLowerCase()).map((m) => ({ member_name: m.name.trim(), member_email: m.email || null, member_phone: m.phone || null, is_leader: false }))];
      const { error: memberError } = await client.from('team_members').insert(members.map((m) => ({ ...m, team_id: createdTeam.id })));
      if (memberError) throw memberError;
    }

    if (body.payment.payment_screenshot_url) {
      const proof = await uploadPaymentProof(
        client,
        body.payment.payment_screenshot_url,
        registration.id,
        registration.registration_number,
        body.payment.payment_screenshot_name,
        body.payment.transaction_id,
      );
      if (!proof) {
        await client.from('registrations').delete().eq('id', registration.id);
        throw new Error('Payment proof could not be stored. Registration was not completed. Please retry the upload.');
      }
      const { error: proofLinkError } = await client
        .from('registrations')
        .update({ payment_screenshot_url: proof.path })
        .eq('id', registration.id);
      if (proofLinkError) throw proofLinkError;
    }

    const { data: finalReg, error: finalError } = await client.from('registrations').select('*,participants(*)').eq('id', registration.id).single();
    if (finalError) throw finalError;
    const aggregate = await getRegistrationAggregate(client, registration.id);
    const legacy = toLegacyRegistration(finalReg, aggregate.events, aggregate.teams, aggregate.members);
    const registrations = aggregate.events.map((event: any) => ({ ...legacy, eventId: event.slug, eventTitle: event.title, eventCategory: event.category, eventDay: event.day, eventTime: event.time_display, eventVenue: event.venue, amountPaid: Number(finalReg.payment_amount || 0) }));

    res.status(201).json({
      success: true,
      data: {
        registration_id: finalReg.id,
        registration_number: finalReg.registration_number,
        receipt_number: finalReg.receipt_number,
        amount: Number(finalReg.payment_amount),
        status: finalReg.status,
        payment_status: finalReg.payment_status,
        registrations,
        message: 'Registration submitted successfully. It is pending admin approval.',
      },
    });
  } catch (error: any) {
    console.error('[POST /api/register]', error);
    res.status(500).json({ success: false, error: { code: 'REGISTRATION_FAILED', message: error.message || 'Registration failed.' } });
  }
});


async function loadAdminRows(client: SupabaseClient, status?: string, search?: string, category?: string): Promise<Registration[]> {
  let query = client.from('registrations').select(`*,participants(*),registration_events(price_at_registration,events(*)),teams(*,team_members(*))`).order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row: any) => {
    const events = (row.registration_events || []).map((x: any) => x.events).filter(Boolean);
    const teams = row.teams || [];
    const members = teams.flatMap((t: any) => t.team_members || []);
    const legacy = toLegacyRegistration(row, events, teams, members);
    if (search) {
      const q = search.toLowerCase();
      const hay = [legacy.userName, legacy.userEmail, legacy.id, legacy.ticketHash, legacy.eventTitle, legacy.userCollege].join(' ').toLowerCase();
      if (!hay.includes(q)) return null;
    }
    if (category !== 'all' && category && legacy.eventCategory !== category) return null;
    return legacy;
  }).filter(Boolean) as Registration[];
}

app.post('/api/admin/auth', async (req, res) => {
  const key = safeString(req.body?.passcode);
  if (!key || (key !== ADMIN_SECRET_KEY && key !== LEGACY_ADMIN_KEY)) {
    res.status(401).json({ success: false, error: { code: 'INVALID_ADMIN_KEY', message: 'Invalid admin passkey.' } });
    return;
  }
  res.json({ success: true, data: { message: 'Admin authentication successful.' } });
});

app.get('/api/admin/registrations', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const client = requireSupabase(res); if (!client) return;
  try {
    const registrations = await loadAdminRows(client, safeString(req.query.status) || 'all', safeString(req.query.search), safeString(req.query.category) || 'all');
    res.json({ success: true, total: registrations.length, registrations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'ADMIN_REGISTRATIONS_FAILED', message: error.message } });
  }
});

app.get('/api/admin/payment-proof/:registrationId', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const client = requireSupabase(res); if (!client) return;
  try {
    const registrationId = safeString(req.params.registrationId);
    if (!registrationId) {
      res.status(400).json({ success: false, error: { code: 'MISSING_REGISTRATION_ID', message: 'Registration ID is required.' } });
      return;
    }

    const { data: proof, error } = await client
      .from('payment_proofs')
      .select('*')
      .eq('registration_id', registrationId)
      .maybeSingle();
    if (error) throw error;
    if (!proof) {
      res.status(404).json({ success: false, error: { code: 'PAYMENT_PROOF_NOT_FOUND', message: 'No payment proof is stored for this registration.' } });
      return;
    }

    const { data: signed, error: signedError } = await client.storage
      .from(proof.storage_bucket || 'payment-proofs')
      .createSignedUrl(proof.storage_path, 300);
    if (signedError || !signed?.signedUrl) throw signedError || new Error('Could not create a temporary payment-proof URL.');

    res.json({
      success: true,
      proof: {
        id: proof.id,
        registration_id: proof.registration_id,
        registration_number: proof.registration_number,
        original_file_name: proof.original_file_name,
        mime_type: proof.mime_type,
        file_size_bytes: proof.file_size_bytes,
        status: proof.status,
        uploaded_at: proof.uploaded_at,
        signed_url: signed.signedUrl,
        expires_in_seconds: 300,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'PAYMENT_PROOF_FAILED', message: error.message || 'Failed to open payment proof.' } });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const client = requireSupabase(res); if (!client) return;
  try {
    const { data: regs, error } = await client.from('registrations').select(`*,registration_events(price_at_registration,events(*))`);
    if (error) throw error;
    const rows = regs || [];
    const approved = rows.filter((r: any) => ['APPROVED', 'CHECKED_IN'].includes(r.status));
    const checkedIn = rows.filter((r: any) => r.status === 'CHECKED_IN');
    const totalRevenue = approved.reduce((s: number, r: any) => s + Number(r.payment_amount || 0), 0);
    const popularity = EVENTS_DATA.map((event) => {
      let count = 0;
      let revenue = 0;
      for (const r of rows) {
        for (const link of r.registration_events || []) {
          if (link.events?.slug === event.id) {
            count++;
            if (['APPROVED', 'CHECKED_IN'].includes(r.status)) revenue += Number(link.price_at_registration || 0);
          }
        }
      }
      return { eventId: event.id, eventTitle: event.title, category: event.category, count, revenue, capacityPct: Math.round((count / Math.max(event.slotsTotal, 1)) * 100) };
    });
    const stats: AdminStats = {
      totalRegistrations: rows.length,
      totalRevenue,
      totalAttendees: checkedIn.length,
      techRegistrations: popularity.filter((p) => p.category === 'technical').reduce((s, p) => s + p.count, 0),
      nonTechRegistrations: popularity.filter((p) => p.category === 'non-technical').reduce((s, p) => s + p.count, 0),
      day1Count: popularity.filter((p) => EVENTS_DATA.find((e) => e.id === p.eventId)?.day === 'Day 1').reduce((s, p) => s + p.count, 0),
      day2Count: popularity.filter((p) => EVENTS_DATA.find((e) => e.id === p.eventId)?.day === 'Day 2').reduce((s, p) => s + p.count, 0),
      eventsPopularity: popularity,
    };
    res.json({ success: true, stats, paidCount: approved.length, pendingCount: rows.filter((r: any) => r.status === 'PENDING').length, failedCount: rows.filter((r: any) => r.status === 'REJECTED').length, maxCapacity: 200, remainingSeats: Math.max(0, 200 - approved.length) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'ADMIN_STATS_FAILED', message: error.message } });
  }
});

function buildApprovalEmail(input: { name: string; registrationNumber: string; code: string; events: any[]; teamNames: string[]; amount: number; qrUrl: string }) {
  const eventsHtml = input.events.map((e) => `<li><strong>${escapeHtml(e.title)}</strong> — ${escapeHtml(e.day)} • ${escapeHtml(e.time_display || '')} • ${escapeHtml(e.venue)}</li>`).join('');
  const teamsHtml = input.teamNames.length ? `<p><b>Team:</b> ${input.teamNames.map(escapeHtml).join(', ')}</p>` : '';
  return `<!doctype html><html><body style="margin:0;background:#030905;color:#fff;font-family:Arial,sans-serif;padding:24px"><div style="max-width:620px;margin:auto;background:#06120a;border:1px solid #00ff66;border-radius:16px;padding:28px"><div style="color:#00ff66;font-weight:800;letter-spacing:2px">IGNITEX 2026</div><h1>Registration Approved</h1><p>Hello ${escapeHtml(input.name)}, your registration has been approved.</p><div style="background:#020a04;border:1px dashed #00ff66;border-radius:12px;padding:18px"><p><b>Registration:</b> ${escapeHtml(input.registrationNumber)}</p><p><b>Verification code:</b></p><div style="font-size:24px;font-weight:900;letter-spacing:3px;color:#00ff66">${escapeHtml(input.code)}</div><p><b>Amount:</b> ₹${input.amount}</p>${teamsHtml}<h3>Events</h3><ul>${eventsHtml}</ul><img src="${input.qrUrl}" width="220" height="220" alt="Verification QR" style="display:block;margin:20px auto;background:#fff;padding:8px;border-radius:10px"/></div><p style="color:#aaa">Present this QR or verification code at the event verification desk.</p></div></body></html>`;
}

async function sendApprovalEmail(client: SupabaseClient, registrationId: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend || !RESEND_FROM_EMAIL) return { success: false, error: 'RESEND_API_KEY or RESEND_FROM_EMAIL is missing.' };
  const aggregate = await getRegistrationAggregate(client, registrationId);
  const recipient = aggregate.reg.participants?.email;
  if (!recipient) return { success: false, error: 'Participant email not found.' };
  const verifyUrl = `${APP_URL}/verify?token=${encodeURIComponent(aggregate.reg.verification_qr_token)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(verifyUrl)}`;
  const html = buildApprovalEmail({ name: aggregate.reg.participants.full_name, registrationNumber: aggregate.reg.registration_number, code, events: aggregate.events, teamNames: aggregate.teams.map((t: any) => t.team_name), amount: Number(aggregate.reg.payment_amount || 0), qrUrl });
  const result = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: recipient,
    subject: `IGNITEX 2026 — Registration Approved | ${aggregate.reg.registration_number}`,
    html,
  });
  if (result.error) return { success: false, error: result.error.message };
  await client.from('email_logs').insert({ registration_id: registrationId, recipient_email: recipient, recipient_name: aggregate.reg.participants.full_name, subject: `IGNITEX 2026 — Registration Approved | ${aggregate.reg.registration_number}`, email_type: 'REGISTRATION_APPROVED', resend_message_id: result.data?.id || null, status: 'SENT' });
  return { success: true, messageId: result.data?.id };
}

app.post('/api/admin/approve-registration', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const client = requireSupabase(res); if (!client) return;
  try {
    const id = safeString(req.body.registration_id || req.body.registrationId);
    if (!id) { res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'registration_id is required.' } }); return; }
    const { data: existing, error } = await client.from('registrations').select('*').eq('id', id).single();
    if (error || !existing) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registration not found.' } }); return; }
    if (existing.status === 'APPROVED' || existing.status === 'CHECKED_IN') {
      res.json({ success: true, data: { message: 'Registration is already approved.', registration_id: id, verification_code: existing.verification_code } });
      return;
    }
    if (existing.status !== 'PENDING') { res.status(409).json({ success: false, error: { code: 'INVALID_STATUS', message: `Registration is ${existing.status}.` } }); return; }
    const code = generateVerificationCode();
    const qrToken = generateQrToken();
    const { error: updateError } = await client.from('registrations').update({ status: 'APPROVED', payment_status: 'VERIFIED', approved_at: new Date().toISOString(), verification_code: code, verification_qr_token: qrToken }).eq('id', id);
    if (updateError) throw updateError;
    const email = await sendApprovalEmail(client, id, code);
    res.json({ success: true, data: { message: email.success ? 'Registration approved and email sent.' : `Registration approved, but email failed: ${email.error}`, registration_id: id, verification_code: code, email_sent: email.success } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'APPROVAL_FAILED', message: error.message } });
  }
});

app.post('/api/admin/reject-registration', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const client = requireSupabase(res); if (!client) return;
  try {
    const id = safeString(req.body.registration_id || req.body.registrationId);
    const reason = safeString(req.body.rejection_reason) || 'Payment could not be verified.';
    const { error } = await client.from('registrations').update({ status: 'REJECTED', payment_status: 'FAILED', rejected_at: new Date().toISOString(), rejection_reason: reason }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, data: { message: 'Registration rejected.', registration_id: id } });
  } catch (error: any) { res.status(500).json({ success: false, error: { code: 'REJECTION_FAILED', message: error.message } }); }
});

app.post('/api/admin/resend-email', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const client = requireSupabase(res); if (!client) return;
  try {
    const id = safeString(req.body.registration_id || req.body.registrationId);
    const { data: reg, error } = await client.from('registrations').select('*').eq('id', id).single();
    if (error || !reg) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Registration not found.' } }); return; }
    if (!reg.verification_code || !reg.verification_qr_token) { res.status(409).json({ success: false, error: { code: 'NOT_APPROVED', message: 'Approve the registration before sending the pass.' } }); return; }
    const result = await sendApprovalEmail(client, id, reg.verification_code);
    if (!result.success) { res.status(502).json({ success: false, error: { code: 'EMAIL_FAILED', message: result.error } }); return; }
    res.json({ success: true, data: { message: 'Pass email resent successfully.' } });
  } catch (error: any) { res.status(500).json({ success: false, error: { code: 'RESEND_FAILED', message: error.message } }); }
});

app.post('/api/attendance/verify', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const client = requireSupabase(res); if (!client) return;
  try {
    let token = safeString(req.body.qr_token || req.body.qrToken || req.body.verification_code || req.body.registrationId);
    const confirmCheckin = Boolean(req.body.confirm_checkin || req.body.confirmCheckin);
    if (!token) { res.status(400).json({ valid: false, status: 'INVALID', message: 'QR token or verification code is required.' }); return; }

    // Accept either the raw QR token or an email QR URL such as /verify?token=...
    try {
      if (/^https?:\/\//i.test(token)) {
        const parsed = new URL(token);
        token = parsed.searchParams.get('token') || parsed.searchParams.get('qr_token') || token;
      }
    } catch { /* raw token */ }

    let query = client.from('registrations').select('*').limit(1);
    if (token.toUpperCase().startsWith('IGX-')) query = query.eq('registration_number', token.toUpperCase());
    else if (token.toUpperCase().startsWith('IGN-')) query = query.eq('verification_code', token.toUpperCase());
    else query = query.eq('verification_qr_token', token);

    const { data: reg, error } = await query.maybeSingle();
    if (error || !reg) { res.json({ valid: false, status: 'INVALID', message: 'Invalid QR pass or verification token.' }); return; }
    const aggregate = await getRegistrationAggregate(client, reg.id);
    const participant = { name: aggregate.reg.participants.full_name, college: aggregate.reg.participants.college, department: aggregate.reg.participants.department };
    const events = aggregate.events.map((e: any) => ({ title: e.title, venue: e.venue, day: e.day }));
    const team = aggregate.teams[0] ? { name: aggregate.teams[0].team_name, members: aggregate.members.filter((m: any) => m.team_id === aggregate.teams[0].id).map((m: any) => m.member_name) } : null;

    if (reg.status === 'CHECKED_IN') {
      res.json({ valid: true, status: 'ALREADY_CHECKED_IN', message: `Already checked in at ${reg.verified_at || 'earlier'}.`, registration_number: reg.registration_number, participant, events, team, checked_in: true });
      return;
    }
    if (reg.status !== 'APPROVED') {
      res.json({ valid: false, status: reg.status === 'REJECTED' ? 'REJECTED' : 'PENDING', message: `Registration is ${reg.status}. Only APPROVED passes can enter campus.`, registration_number: reg.registration_number, participant, events, team, checked_in: false });
      return;
    }

    // First QR scan verifies identity. The explicit CHECK-IN button performs the irreversible entry action.
    if (!confirmCheckin) {
      res.json({ valid: true, status: 'APPROVED', message: `QR verified for ${aggregate.reg.participants.full_name}. Press CHECK-IN PARTICIPANT to record campus entry.`, registration_number: reg.registration_number, participant, events, team, checked_in: false });
      return;
    }

    const checkinTime = new Date().toISOString();
    const { data: updated, error: updateError } = await client
      .from('registrations')
      .update({ status: 'CHECKED_IN', verified_at: checkinTime, verified_by: safeString(req.body.staff_id) || null })
      .eq('id', reg.id)
      .eq('status', 'APPROVED')
      .select('id')
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) { res.json({ valid: true, status: 'ALREADY_CHECKED_IN', message: 'This participant was checked in by another staff member.', registration_number: reg.registration_number, participant, events, team, checked_in: true }); return; }

    await client.from('campus_checkins').upsert({
      registration_id: reg.id,
      registration_number: reg.registration_number,
      participant_id: reg.participant_id,
      checked_in_at: checkinTime,
      checked_in_by: safeString(req.body.staff_id) || null,
      checked_in_by_email: safeString(req.body.staff_email) || null,
      verification_method: 'QR_SCAN',
    }, { onConflict: 'registration_id' });

    await client.from('admin_audit_logs').insert({
      admin_id: safeString(req.body.staff_id) || null,
      admin_email: safeString(req.body.staff_email) || 'admin@ignitex.edu',
      action: 'REGISTRATION_CHECKED_IN',
      registration_id: reg.id,
      metadata: { checkin_time: checkinTime, verification_method: 'QR_SCAN' },
    });

    res.json({ valid: true, status: 'APPROVED', message: `Checked in successfully. Welcome ${aggregate.reg.participants.full_name}!`, registration_number: reg.registration_number, participant, events, team, checked_in: true });
  } catch (error: any) { res.status(500).json({ valid: false, status: 'ERROR', message: error.message }); }
});

app.get('/api/admin/participant-events', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const client = requireSupabase(res); if (!client) return;
  try {
    const { data, error } = await client
      .from('participant_event_registrations')
      .select('registration_number,participant_name,event_name,registration_status,registered_at')
      .order('registered_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, rows: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'PARTICIPANT_EVENT_REPORT_FAILED', message: error.message } });
  }
});

app.get('/api/admin/event-counts', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const client = requireSupabase(res); if (!client) return;
  try {
    const { data, error } = await client
      .from('event_registration_counts')
      .select('event_id,registered_count,approved_count,checked_in_count,updated_at,events(title,slug,max_capacity)')
      .order('registered_count', { ascending: false });
    if (error) throw error;
    res.json({ success: true, counts: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'EVENT_COUNTS_FAILED', message: error.message } });
  }
});

app.get('/api/admin/export', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const client = requireSupabase(res); if (!client) return;
  try {
    const rows = await loadAdminRows(client);
    const headers = ['Registration ID','Receipt','Participant','Email','Phone','College','Events','Team','Amount','Payment Status','Registration Status','Checked In','Registered At'];
    const csvEscape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.join(','), ...rows.map((r) => [r.id,r.receiptNumber,r.userName,r.userEmail,r.userPhone,r.userCollege,r.eventTitle,r.teamName || '',r.amountPaid,r.paymentStatus,r.attended ? 'CHECKED_IN' : 'PENDING',r.attended ? 'YES' : 'NO',r.registeredAt].map(csvEscape).join(','))].join('\n');
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition',`attachment; filename="ignitex-registrations-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) { res.status(500).json({ success:false,error:{code:'EXPORT_FAILED',message:error.message}}); }
});

app.get('/api/registrations/:id', async (req,res) => {
  const client = requireSupabase(res); if (!client) return;
  try {
    const aggregate = await getRegistrationAggregate(client, req.params.id);
    const legacy = toLegacyRegistration(aggregate.reg, aggregate.events, aggregate.teams, aggregate.members);
    const qrCodeDataUrl = aggregate.reg.verification_qr_token ? await QRCode.toDataURL(aggregate.reg.verification_qr_token, { width: 250, margin: 1 }) : '';
    res.json({ success:true, registration: legacy, data:{...legacy, qrCodeDataUrl}});
  } catch (error:any) { res.status(404).json({success:false,error:'Registration not found'}); }
});

app.get('/api/admin/sent-emails', async (req,res) => {
  if (!requireAdmin(req,res)) return;
  const client = requireSupabase(res); if (!client) return;
  try { const {data,error}=await client.from('email_logs').select('*').order('created_at',{ascending:false}); if(error)throw error; res.json({success:true,emails:data||[],sentEmails:data||[]}); }
  catch(error:any){res.status(500).json({success:false,error:{code:'EMAIL_LOG_FAILED',message:error.message}});}
});

// Development-only helper: makes it obvious which env values are missing without exposing secrets.
app.get('/api/config-status', (_req,res) => {
  res.json({
    supabaseUrlConfigured: Boolean(SUPABASE_URL),
    supabaseServiceRoleConfigured: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    resendConfigured: Boolean(RESEND_API_KEY),
    resendFromConfigured: Boolean(RESEND_FROM_EMAIL),
    appUrlConfigured: Boolean(process.env.APP_URL),
  });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled server error]', err);
  res.status(500).json({ success:false,error:{code:'INTERNAL_ERROR',message:'Internal server error.'}});
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req,res) => res.sendFile(path.join(distPath,'index.html')));
  }
  app.listen(PORT, () => {
    console.log(`IgniteX server running on http://localhost:${PORT}`);
    console.log(`Supabase: ${supabaseAdmin ? 'configured' : 'NOT CONFIGURED'}`);
    console.log(`Resend: ${resend && RESEND_FROM_EMAIL ? 'configured' : 'NOT CONFIGURED'}`);
  });
}

startServer().catch((error) => { console.error(error); process.exit(1); });
