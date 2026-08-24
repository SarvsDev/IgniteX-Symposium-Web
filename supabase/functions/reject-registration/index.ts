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
    const { registration_id, rejection_reason, admin_id, admin_email } = body;

    if (!registration_id || !rejection_reason) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'MISSING_PARAM', message: 'registration_id and rejection_reason are required' },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Fetch registration with participant
    const { data: reg, error: fetchErr } = await supabase
      .from('registrations')
      .select('*, participants (*)')
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

    // 2. Update Registration
    const { data: updatedReg, error: updateErr } = await supabase
      .from('registrations')
      .update({
        status: 'REJECTED',
        rejected_at: new Date().toISOString(),
        rejection_reason: rejection_reason.trim(),
      })
      .eq('id', reg.id)
      .select('*')
      .single();

    if (updateErr) {
      throw new Error(`Failed to reject registration: ${updateErr.message}`);
    }

    // 3. Send Rejection Notice Email
    let emailSent = false;
    let resendMessageId = null;
    let emailErrorMessage = null;

    if (resendApiKey && reg.participants?.email) {
      try {
        const participantName = reg.participants.full_name || 'Participant';
        const emailHtml = `
<!DOCTYPE html>
<html>
<body style="background-color: #030a05; color: #ffffff; font-family: monospace; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #06120a; border: 2px solid #ef4444; border-radius: 12px; padding: 25px;">
    <h1 style="color: #ef4444; text-align: center; text-transform: uppercase;">IGNITEX 2026 // REGISTRATION UPDATE</h1>
    <p>Greetings <strong>${participantName}</strong>,</p>
    <p>We regret to inform you that your registration (${reg.registration_number}) was not approved.</p>
    
    <div style="background-color: #1a0606; border: 1px dashed #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 4px 0; color: #ef4444;"><strong>Reason:</strong> ${rejection_reason}</p>
    </div>

    <p style="font-size: 12px; color: #a3a3a3;">If you believe this is in error, please contact the symposium helpdesk with your payment reference.</p>
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
            subject: `Registration Update — ${reg.registration_number}`,
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

    // 4. Record Email Log
    if (reg.participants?.email) {
      await supabase.from('email_logs').insert({
        registration_id: reg.id,
        recipient_email: reg.participants.email,
        recipient_name: reg.participants.full_name,
        subject: `Registration Update — ${reg.registration_number}`,
        email_type: 'REGISTRATION_REJECTED',
        resend_message_id: resendMessageId,
        status: emailSent ? 'DELIVERED' : 'FAILED',
        error_message: emailErrorMessage,
        sent_at: new Date().toISOString(),
      });
    }

    // 5. Record Admin Audit
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin_id || null,
      admin_email: admin_email || 'admin@ignitex.edu',
      action: 'REGISTRATION_REJECTED',
      registration_id: reg.id,
      metadata: {
        reason: rejection_reason,
        email_sent: emailSent,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'Registration rejected.',
          registration_id: reg.id,
          status: 'REJECTED',
          email_dispatched: emailSent,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Reject Error]:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'REJECT_ERROR', message: err.message || 'Failed to reject registration' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
