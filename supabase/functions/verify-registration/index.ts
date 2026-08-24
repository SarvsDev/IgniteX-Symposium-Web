import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ valid: false, status: 'CONFIG_ERROR', message: 'Database credentials not configured.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    let token = String(body.registration_id || body.registration_number || body.qr_token || body.verification_code || '').trim();
    const confirmCheckin = Boolean(body.confirm_checkin);

    if (/^https?:\/\//i.test(token)) {
      try {
        const parsed = new URL(token);
        token = parsed.searchParams.get('token') || parsed.searchParams.get('qr_token') || token;
      } catch { /* keep raw value */ }
    }

    token = token.toUpperCase();
    if (!token) return new Response(JSON.stringify({ valid: false, status: 'INVALID', message: 'Registration ID or QR token is required.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: reg, error } = await supabase
      .from('registrations')
      .select(`*, participants(*), registration_events(events(*)), teams(team_name, team_members(member_name))`)
      .eq('registration_number', token)
      .maybeSingle();

    if (error || !reg) return new Response(JSON.stringify({ valid: false, status: 'INVALID', message: 'Invalid Registration ID / QR pass.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const participant = { name: reg.participants?.full_name, college: reg.participants?.college, department: reg.participants?.department };
    const events = (reg.registration_events || []).map((re: any) => ({ title: re.events?.title, venue: re.events?.venue, day: re.events?.day }));
    const team = reg.teams?.[0] ? { name: reg.teams[0].team_name, members: reg.teams[0].team_members?.map((m: any) => m.member_name) || [] } : null;

    if (reg.status === 'CHECKED_IN') return new Response(JSON.stringify({ valid: true, status: 'ALREADY_CHECKED_IN', message: 'Participant is already checked in.', registration_number: reg.registration_number, participant, events, team, checked_in: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (reg.status !== 'APPROVED') return new Response(JSON.stringify({ valid: false, status: reg.status, message: `Registration is ${reg.status}. Only APPROVED registrations can enter campus.`, registration_number: reg.registration_number, participant, events, team, checked_in: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (!confirmCheckin) return new Response(JSON.stringify({ valid: true, status: 'APPROVED', message: `QR verified for ${reg.participants?.full_name}. Press CHECK-IN PARTICIPANT to record campus entry.`, registration_number: reg.registration_number, participant, events, team, checked_in: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: result, error: checkinError } = await supabase.rpc('check_in_registration', {
      p_registration_id: reg.id,
      p_staff_id: body.staff_id || null,
      p_staff_email: body.staff_email || 'admin@ignitex.edu',
    });
    if (checkinError) throw checkinError;

    const already = result?.status === 'ALREADY_CHECKED_IN';
    return new Response(JSON.stringify({
      valid: already || result?.status === 'CHECKED_IN',
      status: already ? 'ALREADY_CHECKED_IN' : result?.status || 'ERROR',
      message: result?.message || 'Check-in failed.',
      registration_number: reg.registration_number,
      participant,
      events,
      team,
      checked_in: Boolean(result?.checked_in),
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ valid: false, status: 'ERROR', message: err.message || 'Verification service failure.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
