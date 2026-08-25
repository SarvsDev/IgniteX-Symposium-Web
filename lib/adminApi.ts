import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { adminSecrets, envValue, supabaseConfig } from './serverEnv.js';

function getSupabase(): SupabaseClient | null {
  const { url, serviceRoleKey, configured } = supabaseConfig();
  if (!configured) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getSmtpConfig() {
  const user = envValue('GMAIL_SMTP_USER', 'SMTP_USER', 'GMAIL_USER');
  const appPassword = envValue('GMAIL_SMTP_APP_PASSWORD', 'SMTP_PASS', 'GMAIL_APP_PASSWORD');
  const fromName = envValue('GMAIL_SMTP_FROM_NAME', 'SMTP_FROM_NAME') || 'IgniteX 2026';
  return { user, appPassword, fromName, configured: Boolean(user && appPassword) };
}

function createGmailTransport() {
  const config = getSmtpConfig();
  if (!config.configured) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.user, pass: config.appPassword },
  });
}

function getAppUrl(): string {
  return envValue('APP_URL') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}

function text(v: unknown): string { return typeof v === 'string' ? v.trim() : ''; }
function isAdmin(req: any): boolean {
  const { allowed } = adminSecrets();
  const key = text(req.headers['x-admin-key']);
  const auth = text(req.headers.authorization);
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return allowed.has(key) || allowed.has(bearer);
}
function unauthorized(res: any) {
  return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing admin key.' } });
}
function db(res: any): SupabaseClient | null {
  const config = supabaseConfig();
  const client = getSupabase();
  if (!client) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: `Supabase server environment variables are missing: ${config.missing.join(', ') || 'unknown configuration error'}.`,
      },
    });
    return null;
  }
  return client;
}
function jsonBody(req: any): any {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return typeof req.body === 'string' ? JSON.parse(req.body) : {}; } catch { return {}; }
}
function eventRecord(link: any): any { return Array.isArray(link?.events) ? link.events[0] : link?.events; }

async function aggregate(client: SupabaseClient, id: string) {
  const { data: reg, error: regError } = await client.from('registrations').select('*,participants(*)').eq('id', id).single();
  if (regError || !reg) throw regError || new Error('Registration not found');
  const { data: links, error: linkError } = await client.from('registration_events').select('price_at_registration,event_id,events(*)').eq('registration_id', id);
  if (linkError) throw linkError;
  const { data: teams, error: teamError } = await client.from('teams').select('*,team_members(*)').eq('registration_id', id);
  if (teamError) throw teamError;
  return { reg, links: links || [], events: (links || []).map(eventRecord).filter(Boolean), teams: teams || [] };
}

function legacy(row: any, events: any[], teams: any[] = []) {
  const first = events[0] || {};
  const teamDetails = teams.map((t: any) => ({
    eventTitle: events.find((e: any) => e.id === t.event_id || e.slug === t.event_id)?.title || t.event_id || '',
    eventId: t.event_id || '',
    teamName: t.team_name || '',
    members: (t.team_members || []).map((m: any) => m.member_name).filter(Boolean),
  }));
  return {
    id: row.id,
    ticketHash: row.registration_number || '',
    registrationNumber: row.registration_number || '',
    receiptNumber: row.receipt_number || `RCPT-${String(row.registration_number || '').replace(/^REG-2026-/, '').replace(/^IGX-/, '')}`,
    userId: row.participant_id,
    userName: row.participants?.full_name || '',
    userAge: row.participants?.age != null ? String(row.participants.age) : undefined,
    userEmail: row.participants?.email || '',
    userPhone: row.participants?.phone || '',
    userCollege: row.participants?.college || '',
    department: row.participants?.department || undefined,
    collegeYear: row.participants?.college_year || undefined,
    eventId: first.slug || first.id || '',
    eventTitle: events.map((e: any) => e.title).join(' + ') || 'IgniteX Event',
    eventCategory: first.category || 'technical',
    eventDay: first.day || 'Day 1',
    eventTime: first.time_display || '',
    eventVenue: first.venue || '',
    teamName: teamDetails[0]?.teamName,
    teamMembers: teamDetails[0]?.members,
    teams: teamDetails,
    amountPaid: Number(row.payment_amount || 0),
    paymentGateway: row.payment_gateway || 'BANK_TRANSFER',
    transactionId: row.transaction_id || '',
    paymentScreenshot: row.payment_screenshot_url || undefined,
    registeredAt: row.submitted_at || row.created_at,
    paymentStatus: ['APPROVED','CHECKED_IN'].includes(row.status) ? 'SUCCESS' : row.status === 'REJECTED' ? 'REFUNDED' : 'PENDING',
    attended: row.status === 'CHECKED_IN' || Boolean(row.verified_at),
    scannedAt: row.verified_at || undefined,
  };
}

async function loadRows(client: SupabaseClient, status = 'all', search = '', category = 'all') {
  let query = client.from('registrations').select('*,participants(*),registration_events(price_at_registration,events(*)),teams(*,team_members(*))').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  const q = search.toLowerCase();
  return (data || []).map((row: any) => {
    const events = (row.registration_events || []).map(eventRecord).filter(Boolean);
    const r = legacy(row, events, row.teams || []);
    if (q) {
      const hay = [r.userName, r.userEmail, r.id, r.ticketHash, r.eventTitle, r.userCollege].join(' ').toLowerCase();
      if (!hay.includes(q)) return null;
    }
    if (category !== 'all' && category && r.eventCategory !== category) return null;
    return r;
  }).filter(Boolean);
}

function escapeHtml(v: unknown): string {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

async function sendApproval(client: SupabaseClient, registrationId: string) {
  const smtp = createGmailTransport();
  const smtpConfig = getSmtpConfig();
  if (!smtp || !smtpConfig.configured) {
    return { success: false, error: 'Gmail SMTP is not configured. Set GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD in Vercel.' };
  }

  const a = await aggregate(client, registrationId);
  const p = a.reg.participants;
  if (!p?.email) return { success: false, error: 'Participant email not found.' };

  const eventsHtml = a.events.map((e: any) => `<li><strong>${escapeHtml(e.title)}</strong></li>`).join('');
  const teamsHtml = a.teams.length ? `<p><b>Team:</b> ${a.teams.map((t: any) => escapeHtml(t.team_name)).join(', ')}</p>` : '';
  const APP_URL = getAppUrl();
  const verifyUrl = `${APP_URL}/verify?token=${encodeURIComponent(a.reg.verification_qr_token || a.reg.registration_number)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(verifyUrl)}`;
  const html = `<!doctype html><html><body style="margin:0;background:#030905;color:#fff;font-family:Arial,sans-serif;padding:24px"><div style="max-width:620px;margin:auto;background:#06120a;border:1px solid #00ff66;border-radius:16px;padding:28px"><div style="color:#00ff66;font-weight:800;letter-spacing:2px">IGNITEX 2026</div><h1>Registration Approved</h1><p>Hello ${escapeHtml(p.full_name)}, your registration has been approved.</p><div style="background:#020a04;border:1px dashed #00ff66;border-radius:12px;padding:18px"><p><b>Registration ID:</b></p><div style="font-size:24px;font-weight:900;letter-spacing:3px;color:#00ff66">${escapeHtml(a.reg.registration_number)}</div><p><b>Amount:</b> ₹${Number(a.reg.payment_amount || 0)}</p>${teamsHtml}<h3>Events</h3><ul>${eventsHtml}</ul><img src="${qrUrl}" width="220" height="220" alt="Registration QR" style="display:block;margin:20px auto;background:#fff;padding:8px;border-radius:10px"/></div><p style="color:#aaa">Present this QR or your Registration ID at the event verification desk.</p></div></body></html>`;
  const subject = `IGNITEX 2026 — Registration Approved | ${a.reg.registration_number}`;
  const from = `${smtpConfig.fromName} <${smtpConfig.user}>`;

  try {
    const info = await smtp.sendMail({
      from,
      to: p.email,
      subject,
      html,
      text: `Hello ${p.full_name}, your IgniteX 2026 registration has been approved. Registration ID: ${a.reg.registration_number}.`,
    });

    try {
      await client.from('email_logs').insert({
        registration_id: registrationId,
        recipient_email: p.email,
        recipient_name: p.full_name,
        subject,
        email_type: 'REGISTRATION_APPROVED',
        resend_message_id: info.messageId || null,
        status: 'SENT',
      });
    } catch (logError) {
      console.warn('[Gmail SMTP] Email sent but email log could not be saved:', logError);
    }

    return { success: true, messageId: info.messageId, recipient: p.email };
  } catch (error: any) {
    const code = error?.code || 'SMTP_ERROR';
    const message = error?.response || error?.message || 'Gmail SMTP rejected the email.';
    console.error('[Gmail SMTP] Send failed:', { code, message });
    return { success: false, error: `Gmail SMTP failed (${code}): ${String(message)}` };
  }
}

export async function handleAdminRoute(req: any, res: any, forcedPath?: string) {
  try {
    const rawPath = forcedPath ?? (Array.isArray(req.query?.path) ? req.query.path.join('/') : String(req.query?.path || ''));
    const path = rawPath.replace(/^\/+|\/+$/g, '');

    if (req.method === 'POST' && path === 'auth') {
      const key = text(jsonBody(req).passcode ?? jsonBody(req).passkey ?? jsonBody(req).key);

      const { configured: adminConfigured, allowed: validAdminKeys } = adminSecrets();
      if (!adminConfigured) {
        console.error('[Admin Auth] ADMIN_SECRET_KEY is missing from the deployment environment.');
        return res.status(500).json({
          success: false,
          error: {
            code: 'ADMIN_KEY_NOT_CONFIGURED',
            message: 'ADMIN_SECRET_KEY is not configured for this deployment.'
          }
        });
      }

      if (!key || !validAdminKeys.has(key)) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_ADMIN_KEY',
            message: 'Invalid admin passkey.'
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { message: 'Admin authentication successful.' }
      });
    }

    if (!isAdmin(req)) return unauthorized(res);
    const client = db(res); if (!client) return;

    if (req.method === 'GET' && path === 'registrations') {
      const rows = await loadRows(client, text(req.query.status) || 'all', text(req.query.search), text(req.query.category) || 'all');
      return res.json({ success: true, total: rows.length, registrations: rows });
    }

    if (req.method === 'GET' && path === 'stats') {
      const { data, error } = await client.from('registrations').select('*,registration_events(price_at_registration,events(*))');
      if (error) throw error;
      const rows = data || [];
      const approved = rows.filter((r:any)=>['APPROVED','CHECKED_IN'].includes(r.status));
      const checked = rows.filter((r:any)=>r.status === 'CHECKED_IN');
      const popularity = new Map<string, any>();
      for (const r of rows) for (const link of r.registration_events || []) {
        const e = eventRecord(link); if (!e) continue;
        const x = popularity.get(e.id) || { eventId:e.id, eventTitle:e.title, category:e.category, count:0, revenue:0, capacityPct:0 };
        x.count++; if (['APPROVED','CHECKED_IN'].includes(r.status)) x.revenue += Number(link.price_at_registration || 0); popularity.set(e.id,x);
      }
      const eventsPopularity = [...popularity.values()];
      return res.json({ success:true, stats:{ totalRegistrations:rows.length, totalRevenue:approved.reduce((s:number,r:any)=>s+Number(r.payment_amount||0),0), totalAttendees:checked.length, techRegistrations:eventsPopularity.filter(x=>x.category==='technical').reduce((s,x)=>s+x.count,0), nonTechRegistrations:eventsPopularity.filter(x=>x.category==='non-technical').reduce((s,x)=>s+x.count,0), day1Count:0, day2Count:0, eventsPopularity }, paidCount:approved.length, pendingCount:rows.filter((r:any)=>r.status==='PENDING').length, failedCount:rows.filter((r:any)=>r.status==='REJECTED').length, maxCapacity:200, remainingSeats:Math.max(0,200-approved.length) });
    }

    if (req.method === 'GET' && path.startsWith('payment-proof/')) {
      const id = decodeURIComponent(path.slice('payment-proof/'.length));
      const { data: proof, error } = await client.from('payment_proofs').select('*').eq('registration_id', id).maybeSingle();
      if (error) throw error; if (!proof) return res.status(404).json({success:false,error:{code:'PAYMENT_PROOF_NOT_FOUND',message:'No payment proof is stored for this registration.'}});
      const { data:signed,error:signedError } = await client.storage.from(proof.storage_bucket || 'payment-proofs').createSignedUrl(proof.storage_path,300);
      if (signedError || !signed?.signedUrl) throw signedError || new Error('Could not create a temporary payment-proof URL.');
      return res.json({success:true,proof:{id:proof.id,registration_id:proof.registration_id,registration_number:proof.registration_number,original_file_name:proof.original_file_name,mime_type:proof.mime_type,file_size_bytes:proof.file_size_bytes,status:proof.status,uploaded_at:proof.uploaded_at,signed_url:signed.signedUrl,expires_in_seconds:300}});
    }

    if (req.method === 'POST' && path === 'approve-registration') {
      const id = text(jsonBody(req).registration_id || jsonBody(req).registrationId); if (!id) return res.status(400).json({success:false,error:{code:'MISSING_ID',message:'registration_id is required.'}});
      const {data:existing,error} = await client.from('registrations').select('*').eq('id',id).single();
      if (error || !existing) return res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'Registration not found.'}});
      if (['APPROVED','CHECKED_IN'].includes(existing.status)) return res.json({success:true,data:{message:'Registration is already approved.',registration_id:id,verification_code:existing.verification_code}});
      if (existing.status !== 'PENDING') return res.status(409).json({success:false,error:{code:'INVALID_STATUS',message:`Registration is ${existing.status}.`}});
      const regNo = existing.registration_number;
      const {error:updateError}=await client.from('registrations').update({status:'APPROVED',payment_status:'VERIFIED',approved_at:new Date().toISOString(),verification_code:regNo,verification_qr_token:regNo}).eq('id',id);
      if(updateError) throw updateError;
      const email=await sendApproval(client,id);
      return res.json({success:true,data:{message:email.success ? (email.testMode ? `Registration approved. TEST email sent to ${email.recipient}.` : 'Registration approved and email sent.') : `Registration approved, but email failed: ${email.error}`,registration_id:id,verification_code:regNo,email_sent:email.success,email_test_mode:Boolean(email.testMode),email_recipient:email.recipient || null}});
    }

    if (req.method === 'POST' && path === 'reject-registration') {
      const b=jsonBody(req), id=text(b.registration_id||b.registrationId), reason=text(b.rejection_reason)||'Payment could not be verified.';
      const {error}=await client.from('registrations').update({status:'REJECTED',payment_status:'FAILED',rejected_at:new Date().toISOString(),rejection_reason:reason}).eq('id',id); if(error) throw error;
      return res.json({success:true,data:{message:'Registration rejected.',registration_id:id}});
    }

    if (req.method === 'POST' && path === 'send-email') {
      const id=text(jsonBody(req).registration_id||jsonBody(req).registrationId); const {data:reg,error}=await client.from('registrations').select('*').eq('id',id).single();
      if(error||!reg) return res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'Registration not found.'}});
      if(!reg.verification_code||!reg.verification_qr_token) return res.status(409).json({success:false,error:{code:'NOT_APPROVED',message:'Approve the registration before sending the pass.'}});
      const result=await sendApproval(client,id); if(!result.success) return res.status(502).json({success:false,error:{code:'EMAIL_FAILED',message:result.error}});
      return res.json({success:true,data:{message:result.testMode ? `TEST pass email sent to ${result.recipient}.` : 'Pass email resent successfully.',email_test_mode:Boolean(result.testMode),email_recipient:result.recipient || null}});
    }

    if (req.method === 'GET' && path === 'participant-events') {
      const {data,error}=await client.from('registrations').select('id,registration_number,status,created_at,participants(full_name),registration_events(events(id,slug,title)),teams(team_name,event_id,team_members(member_name))').order('created_at',{ascending:false}); if(error) throw error;
      const rows:any[]=[]; for(const r of data||[]){ const p=Array.isArray(r.participants)?r.participants[0]:r.participants; const teams=new Map((r.teams||[]).map((t:any)=>[t.event_id,{name:t.team_name||'',members:(t.team_members||[]).map((m:any)=>m.member_name).filter(Boolean)}])); for(const link of r.registration_events||[]){const e=eventRecord(link); const t=[...teams.entries()].find(([id])=>id===e?.id||id===e?.slug)?.[1] as any; rows.push({registration_number:r.registration_number,participant_name:p?.full_name||'',event_name:e?.title||'IgniteX Event',team_name:t?.name||'',team_members:t?.members||[],registration_status:r.status,registered_at:r.created_at});}}
      return res.json({success:true,rows});
    }

    if (req.method === 'GET' && path === 'event-counts') {
      const {data,error}=await client.from('event_registration_counts').select('event_id,registered_count,approved_count,checked_in_count,updated_at,events(title,slug,max_capacity)').order('registered_count',{ascending:false}); if(error) throw error; return res.json({success:true,counts:data||[]});
    }

    if (req.method === 'GET' && (path === 'export' || path === 'database/export')) {
      const rows=await loadRows(client); const headers=['Registration ID','Receipt','Participant','Email','Phone','College','Events','Team','Team Members','Amount','Payment Status','Registration Status','Checked In','Registered At']; const esc=(v:any)=>`"${String(v??'').replace(/"/g,'""')}"`; const csv=[headers.join(','),...rows.map((r:any)=>[r.registrationNumber||r.ticketHash,r.receiptNumber,r.userName,r.userEmail,r.userPhone,r.userCollege,r.eventTitle,r.teamName||'',(r.teams||[]).map((t:any)=>`${t.teamName}: ${(t.members||[]).join(' | ')}`).join(' || '),r.amountPaid,r.paymentStatus,r.attended?'CHECKED_IN':'PENDING',r.attended?'YES':'NO',r.registeredAt].map(esc).join(','))].join('\n'); res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition',`attachment; filename="ignitex-registrations-${Date.now()}.csv"`); return res.status(200).send(csv);
    }

    if (req.method === 'GET' && path === 'sent-emails') {
      const {data,error}=await client.from('email_logs').select('*').order('created_at',{ascending:false}); if(error) throw error; return res.json({success:true,emails:data||[],sentEmails:data||[]});
    }

    return res.status(404).json({success:false,error:{code:'ADMIN_ROUTE_NOT_FOUND',message:`Admin API route not found: /api/admin/${path}`}});
  } catch (error: any) {
    console.error('[Vercel Admin API]', error);
    return res.status(500).json({success:false,error:{code:'ADMIN_API_FAILED',message:error?.message||'Admin API request failed.'}});
  }
}
