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

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          status: 'CONFIG_ERROR',
          error: { code: 'CONFIG_ERROR', message: 'Database credentials not configured' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { verification_code, qr_token, staff_id, staff_email, confirm_checkin } = body;

    const searchCode = (verification_code || '').trim().toUpperCase();
    let searchQrToken = (qr_token || '').trim();
    try {
      if (/^https?:\/\//i.test(searchQrToken)) {
        const parsed = new URL(searchQrToken);
        searchQrToken = parsed.searchParams.get('token') || parsed.searchParams.get('qr_token') || searchQrToken;
      }
    } catch { /* raw token */ }

    if (!searchCode && !searchQrToken) {
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          status: 'INVALID',
          message: 'Verification code or QR token is required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Query registration
    let query = supabase
      .from('registrations')
      .select(`
        id,
        registration_number,
        status,
        payment_status,
        verification_code,
        verification_qr_token,
        verified_at,
        receipt_number,
        participants (
          full_name,
          college,
          department
        ),
        registration_events (
          events (
            title,
            category,
            day,
            time_display,
            venue
          )
        ),
        teams (
          team_name,
          team_members (
            member_name,
            is_leader
          )
        )
      `);

    if (searchQrToken) {
      query = query.or(`verification_qr_token.eq."${searchQrToken}",verification_code.eq."${searchQrToken}",registration_number.eq."${searchQrToken}"`);
    } else if (searchCode) {
      query = query.or(`verification_code.eq."${searchCode}",registration_number.eq."${searchCode}"`);
    }

    const { data: records, error: queryErr } = await query;

    if (queryErr || !records || records.length === 0) {
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'INVALID',
          message: 'Invalid pass or token. No matching record found.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const reg = records[0];

    // 2. Check if already checked in
    if (reg.status === 'CHECKED_IN' || reg.verified_at) {
      return new Response(
        JSON.stringify({
          valid: true,
          status: 'ALREADY_CHECKED_IN',
          message: `Already checked in at ${reg.verified_at || 'earlier today'}.`,
          registration_number: reg.registration_number,
          participant: {
            name: reg.participants?.full_name,
            college: reg.participants?.college,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check if approved
    if (reg.status !== 'APPROVED') {
      return new Response(
        JSON.stringify({
          valid: false,
          status: reg.status,
          message: `Pass is currently ${reg.status}. Only APPROVED passes can be verified at gate.`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. QR verification succeeds before the explicit check-in action.
    if (!confirm_checkin) {
      return new Response(
        JSON.stringify({ valid: true, status: 'APPROVED', message: `QR verified for ${reg.participants?.full_name}. Confirm campus check-in.`, registration_number: reg.registration_number, participant: { name: reg.participants?.full_name, college: reg.participants?.college }, events: reg.registration_events?.map((re: any) => ({ title: re.events?.title, venue: re.events?.venue, day: re.events?.day })) || [], checked_in: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Mark checked in
    const checkinTime = new Date().toISOString();
    await supabase
      .from('registrations')
      .update({
        status: 'CHECKED_IN',
        verified_at: checkinTime,
        verified_by: staff_id || null,
      })
      .eq('id', reg.id);

    // 6. Audit Log
    await supabase.from('admin_audit_logs').insert({
      admin_id: staff_id || null,
      admin_email: staff_email || 'staff@ignitex.edu',
      action: 'REGISTRATION_CHECKED_IN',
      registration_id: reg.id,
      metadata: { checkin_time: checkinTime },
    });

    // 7. Return verified response
    return new Response(
      JSON.stringify({
        valid: true,
        status: 'APPROVED',
        registration_number: reg.registration_number,
        participant: {
          name: reg.participants?.full_name,
          college: reg.participants?.college,
        },
        events: reg.registration_events?.map((re: any) => ({
          title: re.events?.title,
          venue: re.events?.venue,
          day: re.events?.day,
        })) || [],
        team: reg.teams?.[0]
          ? {
              name: reg.teams[0].team_name,
              members: reg.teams[0].team_members?.map((m: any) => m.member_name) || [],
            }
          : null,
        checked_in: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Verification Error]:', err);
    return new Response(
      JSON.stringify({
        valid: false,
        status: 'ERROR',
        message: err.message || 'Verification service failure',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
