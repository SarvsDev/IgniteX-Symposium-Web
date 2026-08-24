import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders } from '../_shared/cors.ts';
import { generateVerificationCode, generateOpaqueQRToken } from '../_shared/security.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'IgniteX 2026 <onboarding@resend.dev>';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'CONFIG_ERROR', message: 'Database credentials not configured' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { registration_id, admin_id, admin_email } = body;

    if (!registration_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'MISSING_PARAM', message: 'registration_id is required' },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Fetch registration with participant and events
    const { data: reg, error: fetchErr } = await supabase
      .from('registrations')
      .select(`
        *,
        participants (*),
        registration_events (
          price_at_registration,
          events (*)
        ),
        teams (
          id,
          team_name,
          team_members (*)
        )
      `)
      .eq('id', registration_id)
      .single();

    if (fetchErr || !reg) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'REGISTRATION_NOT_FOUND', message: 'Registration record not found' },
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Idempotency Check
    if (reg.status === 'APPROVED') {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: 'Registration is already approved.',
            registration: reg,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Generate secure tokens
    const verificationCode = generateVerificationCode('ZHS');
    const verificationQrToken = generateOpaqueQRToken();
    const approvalTimestamp = new Date().toISOString();

    // 4. Update Registration
    const { data: updatedReg, error: updateErr } = await supabase
      .from('registrations')
      .update({
        status: 'APPROVED',
        payment_status: 'VERIFIED',
        approved_at: approvalTimestamp,
        approved_by: admin_id || null,
        verification_code: verificationCode,
        verification_qr_token: verificationQrToken,
      })
      .eq('id', reg.id)
      .select('*')
      .single();

    if (updateErr || !updatedReg) {
      throw new Error(`Failed to update registration status: ${updateErr?.message}`);
    }

    // 5. Update capacity for registered events
    if (reg.registration_events && reg.registration_events.length > 0) {
      for (const re of reg.registration_events) {
        if (re.events?.id) {
          await supabase.rpc('increment_event_capacity', { target_event_id: re.events.id }).catch(() => {
            // fallback manual update
            supabase
              .from('events')
              .update({ current_capacity: (re.events.current_capacity || 0) + 1 })
              .eq('id', re.events.id);
          });
        }
      }
    }

    // 6. Send Approval Email via Resend
    let emailSent = false;
    let resendMessageId = null;
    let emailErrorMessage = null;

    if (resendApiKey && reg.participants?.email) {
      try {
        const participantName = reg.participants.full_name || 'Participant';
        const eventTitles = reg.registration_events?.map((re: any) => re.events?.title).filter(Boolean).join(', ') || 'IgniteX Events';
        const teamName = reg.teams?.[0]?.team_name || null;

        const emailHtml = `
<!DOCTYPE html>
<html>
<body style="background-color: #030a05; color: #ffffff; font-family: monospace; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #06120a; border: 2px solid #00ff66; border-radius: 12px; padding: 25px;">
    <h1 style="color: #00ff66; text-align: center; text-transform: uppercase;">IGNITEX 2026 // PASS APPROVED</h1>
    <p>Greetings <strong>${participantName}</strong>,</p>
    <p>Your registration for <strong>${eventTitles}</strong> has been officially <span style="color: #00ff66; font-weight: bold;">APPROVED</span>.</p>
    
    <div style="background-color: #020703; border: 1px dashed #00ff66; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 4px 0;"><strong>Registration ID:</strong> <span style="color: #00ff66;">${reg.registration_number}</span></p>
      <p style="margin: 4px 0;"><strong>Official Verification Code:</strong> <span style="color: #f59e0b; font-size: 16px; font-weight: bold;">${verificationCode}</span></p>
      ${teamName ? `<p style="margin: 4px 0;"><strong>Team:</strong> ${teamName}</p>` : ''}
      <p style="margin: 4px 0;"><strong>Events:</strong> ${eventTitles}</p>
    </div>

    <p style="font-size: 12px; color: #a3a3a3;">Present this verification code or QR pass at the entrance desk.</p>
  </div>
</body>
</html>
        `;

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: reg.participants.email,
            subject: `Registration Approved — ${eventTitles} | ${reg.registration_number}`,
            html: emailHtml,
          }),
        });

        const resendData = await resendRes.json();
        if (resendRes.ok) {
          emailSent = true;
          resendMessageId = resendData?.id;
        } else {
          emailErrorMessage = JSON.stringify(resendData);
        }
      } catch (err: any) {
        emailErrorMessage = err.message || 'Resend error';
      }
    }

    // 7. Log Email Result
    if (reg.participants?.email) {
      await supabase.from('email_logs').insert({
        registration_id: reg.id,
        recipient_email: reg.participants.email,
        recipient_name: reg.participants.full_name,
        subject: `Registration Approved — ${reg.registration_number}`,
        email_type: 'REGISTRATION_APPROVED',
        resend_message_id: resendMessageId,
        status: emailSent ? 'DELIVERED' : 'FAILED',
        error_message: emailErrorMessage,
        sent_at: new Date().toISOString(),
      });
    }

    // 8. Log Admin Audit
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin_id || null,
      admin_email: admin_email || 'admin@ignitex.edu',
      action: 'REGISTRATION_APPROVED',
      registration_id: reg.id,
      metadata: {
        verification_code: verificationCode,
        amount: reg.payment_amount,
        email_sent: emailSent,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'Registration approved successfully!',
          registration_id: reg.id,
          verification_code: verificationCode,
          qr_token: verificationQrToken,
          email_dispatched: emailSent,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Approve Error]:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'APPROVAL_ERROR', message: err.message || 'Failed to approve registration' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
