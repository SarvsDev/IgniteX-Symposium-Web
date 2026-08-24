import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders } from '../_shared/cors.ts';

interface RegisterPayload {
  participant: {
    full_name: string;
    email: string;
    phone: string;
    age?: number | string;
    college: string;
    department?: string;
    college_year?: string;
  };
  selected_events: Array<{
    event_id: string; // UUID or slug
  }>;
  teams?: Array<{
    event_id: string;
    team_name: string;
    members: Array<{
      name: string;
      email?: string;
      phone?: string;
    }>;
  }>;
  payment: {
    transaction_id?: string;
    payment_screenshot_url?: string;
    payment_gateway?: string;
  };
}

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
          error: { code: 'CONFIG_ERROR', message: 'Supabase credentials not configured' },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: RegisterPayload = await req.json();

    const { participant, selected_events, teams = [], payment } = body;

    // 1. Basic input validation
    if (!participant || !participant.full_name || !participant.email || !participant.phone || !participant.college) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Participant full name, email, phone, and college are required.' },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!selected_events || selected_events.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'NO_EVENTS_SELECTED', message: 'At least one event must be selected.' },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = participant.email.trim().toLowerCase();

    // 2. Fetch selected events from DB
    const eventIdsOrSlugs = selected_events.map((e) => e.event_id);
    const { data: dbEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .or(`id.in.(${eventIdsOrSlugs.map((id) => `"${id}"`).join(',')}),slug.in.(${eventIdsOrSlugs.map((s) => `"${s}"`).join(',')})`);

    if (eventsError || !dbEvents || dbEvents.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'EVENTS_NOT_FOUND', message: 'One or more selected events were not found.' },
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check for duplicates for this participant
    // Check if participant exists
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existingParticipant) {
      // Check existing registrations for these specific events
      const dbEventIds = dbEvents.map((e) => e.id);
      const { data: existingRegEvents } = await supabase
        .from('registration_events')
        .select('event_id, registrations!inner(status, participant_id)')
        .eq('registrations.participant_id', existingParticipant.id)
        .in('event_id', dbEventIds)
        .neq('registrations.status', 'REJECTED')
        .neq('registrations.status', 'CANCELLED');

      if (existingRegEvents && existingRegEvents.length > 0) {
        const duplicateEvent = dbEvents.find((e) => e.id === existingRegEvents[0].event_id);
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'REGISTRATION_ALREADY_EXISTS',
              message: `You are already registered for '${duplicateEvent?.title || 'this event'}'.`,
            },
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Validate Team Sizes and Event Capacity
    for (const ev of dbEvents) {
      if (ev.current_capacity >= ev.max_capacity) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'EVENT_CAPACITY_REACHED',
              message: `Registration for '${ev.title}' is full. Maximum capacity reached.`,
            },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (ev.is_team_event) {
        const teamForEvent = teams.find((t) => t.event_id === ev.id || t.event_id === ev.slug);
        if (!teamForEvent || !teamForEvent.team_name?.trim()) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'TEAM_NAME_REQUIRED',
                message: `Team name is required for team event '${ev.title}'.`,
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Leader is 1 + members
        const totalTeamMembers = 1 + (teamForEvent.members?.length || 0);
        if (totalTeamMembers < ev.min_team_size || totalTeamMembers > ev.max_team_size) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'INVALID_TEAM_SIZE',
                message: `'${ev.title}' requires between ${ev.min_team_size} and ${ev.max_team_size} members. Found: ${totalTeamMembers}.`,
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 5. Calculate Server-Authoritative Price & Combo Discounts
    // Check if eligible for combo (e.g. combo-individual-all-access)
    const soloSlugs = ['tech-profile-architect', 'tech-neural-rush', 'nontech-prompt-perfect', 'nontech-memergency'];
    const isAllSoloCombo = dbEvents.length === 4 && dbEvents.every((e) => soloSlugs.includes(e.slug));
    
    let totalCalculatedAmount = 0;
    if (isAllSoloCombo) {
      totalCalculatedAmount = 500.00;
    } else {
      totalCalculatedAmount = dbEvents.reduce((sum, e) => sum + Number(e.entry_fee), 0);
    }

    // 6. Create or Update Participant
    let participantId = existingParticipant?.id;
    if (!participantId) {
      const { data: newPart, error: partError } = await supabase
        .from('participants')
        .insert({
          full_name: participant.full_name.trim(),
          email: normalizedEmail,
          phone: participant.phone.trim(),
          age: participant.age ? Number(participant.age) : null,
          college: participant.college.trim(),
          department: participant.department?.trim() || 'Computer Science & Engineering',
          college_year: participant.college_year?.trim() || '1st Year',
        })
        .select('id')
        .single();

      if (partError || !newPart) {
        throw new Error(`Participant creation error: ${partError?.message}`);
      }
      participantId = newPart.id;
    }

    // 7. Generate Registration Number through the database: IGX-XXXX.
    const { data: regNumber, error: regNumberError } = await supabase.rpc('generate_next_registration_number');
    if (regNumberError || !regNumber) throw new Error(`Registration ID generation failed: ${regNumberError?.message || 'unknown error'}`);
    const receiptNumber = `RCPT-${String(regNumber).replace('IGX-', '')}`;

    // 8. Create Registration (Status: PENDING)
    const { data: newReg, error: regError } = await supabase
      .from('registrations')
      .insert({
        registration_number: regNumber,
        participant_id: participantId,
        status: 'PENDING',
        payment_status: payment.transaction_id ? 'SUBMITTED' : 'PENDING',
        payment_amount: totalCalculatedAmount,
        payment_gateway: payment.payment_gateway || 'UPI',
        transaction_id: payment.transaction_id?.trim() || null,
        payment_screenshot_url: payment.payment_screenshot_url || null,
        receipt_number: receiptNumber,
        submitted_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (regError || !newReg) {
      throw new Error(`Registration record creation failed: ${regError?.message}`);
    }

    // 9. Insert registration_events
    const regEventsRows = dbEvents.map((ev) => ({
      registration_id: newReg.id,
      event_id: ev.id,
      price_at_registration: isAllSoloCombo ? Math.round(500 / dbEvents.length) : Number(ev.entry_fee),
    }));

    const { error: regEventsError } = await supabase.from('registration_events').insert(regEventsRows);
    if (regEventsError) {
      throw new Error(`Registration events mapping failed: ${regEventsError.message}`);
    }

    // 10. Insert Teams & Team Members
    for (const ev of dbEvents) {
      if (ev.is_team_event) {
        const teamInfo = teams.find((t) => t.event_id === ev.id || t.event_id === ev.slug);
        if (teamInfo) {
          const { data: createdTeam, error: teamError } = await supabase
            .from('teams')
            .insert({
              registration_id: newReg.id,
              event_id: ev.id,
              team_name: teamInfo.team_name.trim(),
              team_leader_participant_id: participantId,
            })
            .select('id')
            .single();

          if (teamError || !createdTeam) {
            console.error('Team creation error:', teamError);
            continue;
          }

          // Insert leader as first member
          const memberRows = [
            {
              team_id: createdTeam.id,
              participant_id: participantId,
              member_name: participant.full_name.trim(),
              member_email: normalizedEmail,
              member_phone: participant.phone.trim(),
              is_leader: true,
            },
          ];

          // Insert friends/other members
          if (teamInfo.members && teamInfo.members.length > 0) {
            teamInfo.members.forEach((m) => {
              if (m.name && m.name.trim()) {
                memberRows.push({
                  team_id: createdTeam.id,
                  participant_id: null,
                  member_name: m.name.trim(),
                  member_email: m.email?.trim().toLowerCase() || null,
                  member_phone: m.phone?.trim() || null,
                  is_leader: false,
                });
              }
            });
          }

          await supabase.from('team_members').insert(memberRows);
        }
      }
    }

    // 11. Return response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          registration_id: newReg.id,
          registration_number: newReg.registration_number,
          status: newReg.status,
          payment_status: newReg.payment_status,
          amount: newReg.payment_amount,
          events: dbEvents.map((e) => ({ id: e.id, title: e.title })),
          message: 'Registration submitted successfully. Pending admin verification.',
        },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Register Function Error]:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message || 'Internal registration failure.' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
