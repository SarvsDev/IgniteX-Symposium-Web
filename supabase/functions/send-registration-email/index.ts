import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders } from '../_shared/cors.ts';

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
    const { registration_id, email, admin_id, admin_email } = body;

    // Query registration
    let query = supabase
      .from('registrations')
      .select(`
        *,
        participants (*),
        registration_events (
          events (*)
        ),
        teams (
          team_name,
          team_members (*)
        )
      `);

    if (registration_id) {
      query = query.or(`id.eq."${registration_id}",registration_number.eq."${registration_id}",verification_code.eq."${registration_id}"`);
    } else if (email) {
      query = query.ilike('participants.email', email.trim());
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'MISSING_PARAM', message: 'registration_id or email is required' },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: records, error: queryErr } = await query;
    if (queryErr || !records || records.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'REGISTRATION_NOT_FOUND', message: 'No registration record found' },
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const reg = records[0];
    const recipientEmail = reg.participants?.email;
    const participantName = reg.participants?.full_name || 'Participant';
    const eventTitles = reg.registration_events?.map((re: any) => re.events?.title).filter(Boolean).join(', ') || 'IgniteX Events';
    const verificationCode = reg.verification_code || 'PENDING-APPROVAL';

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'NO_EMAIL', message: 'Participant has no email on record' },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let emailSent = false;
    let resendMessageId = null;
    let emailErrorMessage = null;

    if (resendApiKey) {
      try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<body style="background-color: #030a05; color: #ffffff; font-family: monospace; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #06120a; border: 2px solid #00ff66; border-radius: 12px; padding: 25px;">
    <h1 style="color: #00ff66; text-align: center; text-transform: uppercase;">IGNITEX 2026 // PASS COPY</h1>
    <p>Greetings <strong>${participantName}</strong>,</p>
    <p>Here is your pass confirmation copy for <strong>${eventTitles}</strong>.</p>
    
    <div style="background-color: #020703; border: 1px dashed #00ff66; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 4px 0;"><strong>Registration ID:</strong> <span style="color: #00ff66;">${reg.registration_number}</span></p>
      
      <p style="margin: 4px 0;"><strong>Status:</strong> ${reg.status}</p>
      <p style="margin: 4px 0;"><strong>Events:</strong> ${eventTitles}</p>
    </div>

    <p style="font-size: 12px; color: #a3a3a3;">Present this QR pass or Registration ID at the entry gate.</p>
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
            to: recipientEmail,
            subject: `Registration Pass — ${eventTitles} | ${reg.registration_number}`,
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
        emailErrorMessage = err.message;
      }
    }

    // Log Resend Attempt
    await supabase.from('email_logs').insert({
      registration_id: reg.id,
      recipient_email: recipientEmail,
      recipient_name: participantName,
      subject: `Registration Pass — ${reg.registration_number}`,
      email_type: 'REGISTRATION_RESEND',
      resend_message_id: resendMessageId,
      status: emailSent ? 'DELIVERED' : 'FAILED',
      error_message: emailErrorMessage,
      sent_at: new Date().toISOString(),
    });

    // Audit Log
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin_id || null,
      admin_email: admin_email || 'admin@ignitex.edu',
      action: 'EMAIL_RESENT',
      registration_id: reg.id,
      metadata: { recipient: recipientEmail, email_sent: emailSent },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: emailSent
            ? `Pass email successfully dispatched to ${recipientEmail}`
            : `Email dispatch attempted for ${recipientEmail}`,
          email_dispatched: emailSent,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Send Email Error]:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'EMAIL_ERROR', message: err.message || 'Failed to dispatch email' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
