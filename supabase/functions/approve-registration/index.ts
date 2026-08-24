import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders } from '../_shared/cors.ts';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'IgniteX 2026 <onboarding@resend.dev>';
    if (!supabaseUrl || !serviceKey) throw new Error('Database credentials not configured.');

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const registrationId = String(body.registration_id || '').trim();
    if (!registrationId) return new Response(JSON.stringify({ success: false, error: { code: 'MISSING_PARAM', message: 'registration_id is required.' } }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: reg, error: fetchError } = await supabase
      .from('registrations')
      .select(`*, participants(*), registration_events(price_at_registration, events(*)), teams(id, team_name, team_members(*))`)
      .eq('id', registrationId)
      .single();
    if (fetchError || !reg) return new Response(JSON.stringify({ success: false, error: { code: 'REGISTRATION_NOT_FOUND', message: 'Registration not found.' } }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (reg.status === 'APPROVED' || reg.status === 'CHECKED_IN') {
      return new Response(JSON.stringify({ success: true, data: { message: 'Registration is already approved.', registration_id: reg.id, registration_number: reg.registration_number, verification_code: reg.registration_number } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (reg.status !== 'PENDING') return new Response(JSON.stringify({ success: false, error: { code: 'INVALID_STATUS', message: `Registration is ${reg.status}.` } }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const registrationNumber = reg.registration_number;
    const approvalTimestamp = new Date().toISOString();
    const { error: updateError } = await supabase.from('registrations').update({
      status: 'APPROVED',
      payment_status: 'VERIFIED',
      approved_at: approvalTimestamp,
      approved_by: body.admin_id || null,
      verification_code: registrationNumber,
      verification_qr_token: registrationNumber,
    }).eq('id', reg.id);
    if (updateError) throw updateError;

    let emailSent = false;
    let resendMessageId = null;
    let emailErrorMessage = null;
    if (resendApiKey && reg.participants?.email) {
      try {
        const eventTitles = (reg.registration_events || []).map((x: any) => x.events?.title).filter(Boolean).join(', ') || 'IgniteX Events';
        const verifyUrl = `${Deno.env.get('APP_URL') || ''}/verify?token=${encodeURIComponent(registrationNumber)}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(verifyUrl)}`;
        const eventsHtml = (reg.registration_events || []).map((x: any) => `<li><strong>${escapeHtml(x.events?.title)}</strong> — ${escapeHtml(x.events?.day)} • ${escapeHtml(x.events?.time_display || '')} • ${escapeHtml(x.events?.venue || '')}</li>`).join('');
        const html = `<!doctype html><html><body style="margin:0;background:#030905;color:#fff;font-family:Arial,sans-serif;padding:24px"><div style="max-width:620px;margin:auto;background:#06120a;border:1px solid #00ff66;border-radius:16px;padding:28px"><div style="color:#00ff66;font-weight:800;letter-spacing:2px">IGNITEX 2026</div><h1>Registration Approved</h1><p>Hello ${escapeHtml(reg.participants.full_name)}, your registration has been approved.</p><div style="background:#020a04;border:1px dashed #00ff66;border-radius:12px;padding:18px"><p><b>Registration ID:</b></p><div style="font-size:24px;font-weight:900;letter-spacing:3px;color:#00ff66">${escapeHtml(registrationNumber)}</div><p><b>Amount:</b> ₹${Number(reg.payment_amount || 0)}</p><h3>Events</h3><ul>${eventsHtml}</ul><img src="${qrUrl}" width="220" height="220" alt="Registration QR" style="display:block;margin:20px auto;background:#fff;padding:8px;border-radius:10px"/></div><p style="color:#aaa">Present this QR pass or Registration ID at the event verification desk.</p></div></body></html>`;
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: resendFromEmail, to: reg.participants.email, subject: `IGNITEX 2026 — Registration Approved | ${registrationNumber}`, html }),
        });
        const result = await response.json();
        if (response.ok) { emailSent = true; resendMessageId = result?.id || null; }
        else emailErrorMessage = JSON.stringify(result);
      } catch (error: any) { emailErrorMessage = error.message || 'Email send failed.'; }
    }

    await supabase.from('email_logs').insert({
      registration_id: reg.id,
      recipient_email: reg.participants?.email || 'unknown',
      recipient_name: reg.participants?.full_name || null,
      subject: `IGNITEX 2026 — Registration Approved | ${registrationNumber}`,
      email_type: 'REGISTRATION_APPROVED',
      resend_message_id: resendMessageId,
      status: emailSent ? 'SENT' : 'FAILED',
      error_message: emailErrorMessage,
    });

    await supabase.from('admin_audit_logs').insert({
      admin_id: body.admin_id || null,
      admin_email: body.admin_email || 'admin@ignitex.edu',
      action: 'REGISTRATION_APPROVED',
      registration_id: reg.id,
      metadata: { registration_number: registrationNumber, email_sent: emailSent },
    });

    return new Response(JSON.stringify({ success: true, data: { message: emailSent ? 'Registration approved and email sent.' : 'Registration approved.', registration_id: reg.id, registration_number: registrationNumber, verification_code: registrationNumber, qr_token: registrationNumber, email_dispatched: emailSent } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: { code: 'APPROVAL_ERROR', message: error.message || 'Failed to approve registration.' } }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
