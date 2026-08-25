import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { supabaseConfig } from '../lib/serverEnv.js';

// Registration performs several database/storage operations. Keep the Vercel
// function alive long enough for the full transaction to complete.
export const maxDuration = 60;


const registrationSchema = z.object({
  participant: z.object({
    full_name: z.string().trim().min(2, 'Participant name is required.'),
    email: z.string().trim().email('A valid email is required.'),
    phone: z.string().trim().min(8, 'A valid phone number is required.'),
    age: z.union([z.number(), z.string()]).optional(),
    college: z.string().trim().min(2, 'College is required.'),
    department: z.string().optional(),
    college_year: z.string().optional(),
  }),
  selected_events: z.array(
    z.object({ event_id: z.string().trim().min(1) })
  ).min(1, 'Select at least one event.'),
  teams: z.array(
    z.object({
      event_id: z.string().trim().min(1),
      team_name: z.string().trim().min(1),
      members: z.array(
        z.object({
          name: z.string().trim().min(1),
          email: z.string().email().optional(),
          phone: z.string().optional(),
        })
      ).default([]),
    })
  ).default([]),
  payment: z.object({
    transaction_id: z.string().optional(),
    payment_screenshot_url: z.string().optional(),
    payment_screenshot_name: z.string().optional(),
    payment_gateway: z.string().optional(),
  }).default({}),
});

function json(res: any, status: number, body: unknown) {
  return res.status(status).json(body);
}

function generateRegistrationNumber(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bytes = randomBytes(4);
  let value = 'IGX-';
  for (let i = 0; i < 4; i++) value += chars[bytes[i] % chars.length];
  return value;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function parseDataUrl(input: string): { buffer: Buffer; mime: string; extension: string } | null {
  const match = input.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const allowed: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };

  if (!allowed[mime]) return null;

  try {
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length) return null;
    return { buffer, mime, extension: allowed[mime] };
  } catch {
    return null;
  }
}

async function uploadPaymentProof(
  client: SupabaseClient,
  dataUrl: string,
  registrationId: string,
  registrationNumber: string,
  originalFileName?: string,
  transactionId?: string,
) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw new Error('Invalid payment proof. Upload a PNG, JPG, WEBP or PDF file.');
  }

  // Keep this below typical Vercel request limits. The frontend should compress
  // screenshots before sending them.
  if (parsed.buffer.length > 1.8 * 1024 * 1024) {
    throw new Error('Payment proof is too large. Please upload a compressed image under 1.8 MB.');
  }

  const storagePath = `${registrationNumber}/payment-proof.${parsed.extension}`;

  const { error: storageError } = await client.storage
    .from('payment-proofs')
    .upload(storagePath, parsed.buffer, {
      contentType: parsed.mime,
      upsert: true,
    });

  if (storageError) {
    throw new Error(`Payment proof upload failed: ${storageError.message}`);
  }

  const { error: metadataError } = await client
    .from('payment_proofs')
    .upsert({
      registration_id: registrationId,
      registration_number: registrationNumber,
      storage_bucket: 'payment-proofs',
      storage_path: storagePath,
      original_file_name: originalFileName || null,
      mime_type: parsed.mime,
      file_size_bytes: parsed.buffer.length,
      transaction_id: transactionId?.trim() || null,
      status: 'PENDING',
      uploaded_at: new Date().toISOString(),
    }, { onConflict: 'registration_id' });

  if (metadataError) {
    await client.storage.from('payment-proofs').remove([storagePath]);
    throw new Error(`Payment proof metadata could not be saved: ${metadataError.message}`);
  }

  return storagePath;
}

async function getAggregate(client: SupabaseClient, registrationId: string) {
  const { data: registration, error: registrationError } = await client
    .from('registrations')
    .select('*,participants(*)')
    .eq('id', registrationId)
    .single();

  if (registrationError || !registration) {
    throw registrationError || new Error('Registration could not be loaded after creation.');
  }

  const { data: links, error: linksError } = await client
    .from('registration_events')
    .select('price_at_registration,event_id,events(*)')
    .eq('registration_id', registrationId);

  if (linksError) throw linksError;

  const { data: teams, error: teamsError } = await client
    .from('teams')
    .select('*')
    .eq('registration_id', registrationId);

  if (teamsError) throw teamsError;

  const teamIds = (teams || []).map((team: any) => team.id);
  let members: any[] = [];

  if (teamIds.length) {
    const { data, error } = await client
      .from('team_members')
      .select('*')
      .in('team_id', teamIds);

    if (error) throw error;
    members = data || [];
  }

  return {
    registration,
    events: (links || []).map((link: any) => link.events).filter(Boolean),
    teams: teams || [],
    members,
  };
}

function toResponseRegistration(aggregate: any) {
  const { registration, events, teams, members } = aggregate;
  const firstEvent = events[0] || {};

  const teamDetails = teams.map((team: any) => {
    const event = events.find((item: any) => item.id === team.event_id) || firstEvent;
    return {
      eventId: event.slug || event.id || '',
      eventTitle: event.title || '',
      teamName: team.team_name || '',
      members: members
        .filter((member: any) => member.team_id === team.id)
        .map((member: any) => member.member_name)
        .filter(Boolean),
    };
  });

  return events.map((event: any) => ({
    id: registration.id,
    ticketHash: registration.registration_number,
    registrationNumber: registration.registration_number,
    receiptNumber: registration.receipt_number,
    userId: registration.participant_id,
    userName: registration.participants?.full_name || '',
    userAge: registration.participants?.age != null ? String(registration.participants.age) : undefined,
    userEmail: registration.participants?.email || '',
    userPhone: registration.participants?.phone || '',
    userCollege: registration.participants?.college || '',
    department: registration.participants?.department || undefined,
    collegeYear: registration.participants?.college_year || undefined,
    eventId: event.slug || event.id,
    eventTitle: event.title,
    eventCategory: event.category,
    eventDay: event.day,
    eventTime: event.time_display,
    eventVenue: event.venue,
    teamName: teamDetails.find((team: any) => team.eventId === (event.slug || event.id))?.teamName,
    teamMembers: teamDetails.find((team: any) => team.eventId === (event.slug || event.id))?.members,
    teams: teamDetails,
    amountPaid: Number(registration.payment_amount || 0),
    paymentGateway: registration.payment_gateway || 'BANK_TRANSFER',
    transactionId: registration.transaction_id || '',
    paymentScreenshot: registration.payment_screenshot_url || undefined,
    registeredAt: registration.submitted_at || registration.created_at,
    paymentStatus: 'PENDING',
    attended: false,
  }));
}

export default async function handler(req: any, res: any) {
  // Keep ALL initialization inside the try/catch. Vercel can otherwise turn a
  // bad environment variable or client initialization error into an opaque
  // FUNCTION_INVOCATION_FAILED response.
  try {
    const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY, configured: supabaseConfigured, missing: supabaseMissing } = supabaseConfig();
    let supabase: SupabaseClient | null = null;

    if (supabaseConfigured) {
      try {
        supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
      } catch (clientError: any) {
        console.error('[api/register] Supabase client initialization failed:', clientError);
        return res.status(503).json({
          success: false,
          error: {
            code: 'SUPABASE_CLIENT_INIT_FAILED',
            message: clientError?.message || 'Supabase client could not be initialized.',
          },
        });
      }
    }
    if (req.method !== 'POST') {
      return json(res, 405, {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST /api/register.' },
      });
    }

    const rawBody = typeof req.body === 'string' ? req.body : '';
    if (rawBody && Buffer.byteLength(rawBody, 'utf8') > 3.5 * 1024 * 1024) {
      return json(res, 413, {
        success: false,
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: 'Registration payload is too large. Please use the automatically compressed payment screenshot and try again.',
        },
      });
    }

    if (!supabase) {
      return json(res, 503, {
        success: false,
        error: {
          code: 'SUPABASE_NOT_CONFIGURED',
          message: `Supabase is not configured on Vercel. Set ${supabaseMissing.join(' and ') || 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'} on the project (Production, Preview, and Development), then redeploy.`,
        },
      });
    }

    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return json(res, 400, {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: parsed.error.issues.map((issue) => issue.message).join(', '),
        },
      });
    }

    const body = parsed.data;
    const client = supabase;
    const email = normalizeEmail(body.participant.email);
    const slugs = [...new Set(body.selected_events.map((event) => event.event_id))];

    const { data: events, error: eventsError } = await client
      .from('events')
      .select('*')
      .in('slug', slugs)
      .eq('is_active', true);

    if (eventsError) throw eventsError;

    if (!events || events.length !== slugs.length) {
      return json(res, 400, {
        success: false,
        error: { code: 'INVALID_EVENTS', message: 'One or more selected events are unavailable.' },
      });
    }

    // Team validation is authoritative from the database.
    for (const event of events) {
      if (!event.is_team_event) continue;

      const team = body.teams.find((item) => item.event_id === event.slug);
      if (!team) {
        return json(res, 400, {
          success: false,
          error: { code: 'TEAM_REQUIRED', message: `Team details are required for ${event.title}.` },
        });
      }

      const names = [
        body.participant.full_name,
        ...(team.members || []).map((member) => member.name),
      ]
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean);

      const uniqueNames = new Set(names);

      if (uniqueNames.size < Number(event.min_team_size) || uniqueNames.size > Number(event.max_team_size)) {
        return json(res, 400, {
          success: false,
          error: {
            code: 'INVALID_TEAM_SIZE',
            message: `${event.title} requires ${event.min_team_size}-${event.max_team_size} unique members.`,
          },
        });
      }
    }

    // Reuse the participant record by email.
    const { data: existingParticipant, error: participantLookupError } = await client
      .from('participants')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (participantLookupError) throw participantLookupError;

    let participantId = existingParticipant?.id;

    const participantPayload = {
      full_name: body.participant.full_name.trim(),
      email,
      phone: body.participant.phone.trim(),
      age: body.participant.age ? Number(body.participant.age) || null : null,
      college: body.participant.college.trim(),
      department: body.participant.department?.trim() || null,
      college_year: body.participant.college_year?.trim() || null,
    };

    if (!participantId) {
      const { data: createdParticipant, error } = await client
        .from('participants')
        .insert(participantPayload)
        .select()
        .single();

      if (error) throw error;
      participantId = createdParticipant.id;
    } else {
      const { error } = await client
        .from('participants')
        .update(participantPayload)
        .eq('id', participantId);

      if (error) throw error;
    }

    // Prevent duplicate active registrations for the same participant/event.
    const { data: existingLinks, error: duplicateError } = await client
      .from('registration_events')
      .select('registration_id,event_id,registrations!inner(participant_id,status)')
      .in('event_id', events.map((event: any) => event.id))
      .eq('registrations.participant_id', participantId);

    if (duplicateError) throw duplicateError;

    const activeStatuses = new Set(['PENDING', 'APPROVED', 'CHECKED_IN']);
    if ((existingLinks || []).some((link: any) => activeStatuses.has(link.registrations?.status))) {
      return json(res, 409, {
        success: false,
        error: {
          code: 'REGISTRATION_ALREADY_EXISTS',
          message: 'You are already registered for one or more selected events.',
        },
      });
    }

    const comboSlugs = new Set([
      'tech-profile-architect',
      'nontech-memergency',
      'nontech-prompt-perfect',
    ]);

    const isCombo = events.length === 3 && events.every((event: any) => comboSlugs.has(event.slug));
    const totalAmount = isCombo
      ? 350
      : events.reduce((sum: number, event: any) => sum + Number(event.entry_fee || 0), 0);

    let registration: any = null;
    let lastRegistrationError: any = null;

    for (let attempt = 0; attempt < 8 && !registration; attempt++) {
      const registrationNumber = generateRegistrationNumber();

      const result = await client
        .from('registrations')
        .insert({
          registration_number: registrationNumber,
          participant_id: participantId,
          status: 'PENDING',
          payment_status: body.payment.transaction_id?.trim() ? 'SUBMITTED' : 'PENDING',
          payment_amount: totalAmount,
          payment_gateway: body.payment.payment_gateway || 'BANK_TRANSFER',
          transaction_id: body.payment.transaction_id?.trim() || null,
          registration_source: 'website',
          metadata: { selected_event_slugs: slugs },
        })
        .select('*,participants(*)')
        .single();

      if (!result.error) {
        registration = result.data;
        break;
      }

      lastRegistrationError = result.error;
      if (result.error.code !== '23505') break;
    }

    if (!registration) {
      throw lastRegistrationError || new Error('Could not create a unique registration ID.');
    }

    try {
      const receiptNumber = `RCPT-${registration.registration_number.replace(/^IGX-/, '')}`;

      const { error: receiptError } = await client
        .from('registrations')
        .update({ receipt_number: receiptNumber })
        .eq('id', registration.id);

      if (receiptError) throw receiptError;

      const eventRows = events.map((event: any) => ({
        registration_id: registration.id,
        event_id: event.id,
        price_at_registration: Number(event.entry_fee || 0),
      }));

      const { error: linkError } = await client
        .from('registration_events')
        .insert(eventRows);

      if (linkError) throw linkError;

      for (const event of events) {
        if (!event.is_team_event) continue;

        const team = body.teams.find((item) => item.event_id === event.slug)!;

        const { data: createdTeam, error: teamError } = await client
          .from('teams')
          .insert({
            registration_id: registration.id,
            event_id: event.id,
            team_name: team.team_name.trim(),
            team_leader_participant_id: participantId,
          })
          .select()
          .single();

        if (teamError) throw teamError;

        const leaderName = body.participant.full_name.trim();
        const normalizedLeader = leaderName.toLowerCase();

        const memberRows = [
          {
            team_id: createdTeam.id,
            member_name: leaderName,
            member_email: email,
            member_phone: body.participant.phone.trim(),
            participant_id: participantId,
            is_leader: true,
          },
          ...(team.members || [])
            .filter((member) => member.name.trim().toLowerCase() !== normalizedLeader)
            .map((member) => ({
              team_id: createdTeam.id,
              member_name: member.name.trim(),
              member_email: member.email || null,
              member_phone: member.phone || null,
              is_leader: false,
            })),
        ];

        const { error: memberError } = await client
          .from('team_members')
          .insert(memberRows);

        if (memberError) throw memberError;
      }

      if (body.payment.payment_screenshot_url) {
        const storagePath = await uploadPaymentProof(
          client,
          body.payment.payment_screenshot_url,
          registration.id,
          registration.registration_number,
          body.payment.payment_screenshot_name,
          body.payment.transaction_id,
        );

        const { error: proofLinkError } = await client
          .from('registrations')
          .update({ payment_screenshot_url: storagePath })
          .eq('id', registration.id);

        if (proofLinkError) throw proofLinkError;
      }
    } catch (creationError) {
      // registrations is the parent of registration_events/teams/payment_proofs
      // in the clean schema, so deleting it rolls back the created registration.
      await client.from('registrations').delete().eq('id', registration.id);
      throw creationError;
    }

    const aggregate = await getAggregate(client, registration.id);
    const registrations = toResponseRegistration(aggregate);

    return json(res, 201, {
      success: true,
      data: {
        registration_id: registration.id,
        registration_number: registration.registration_number,
        receipt_number: `RCPT-${registration.registration_number.replace(/^IGX-/, '')}`,
        amount: totalAmount,
        status: 'PENDING',
        payment_status: body.payment.transaction_id?.trim() ? 'SUBMITTED' : 'PENDING',
        registrations,
        message: 'Registration submitted successfully. It is pending admin approval.',
      },
    });
  } catch (error: any) {
    console.error('[api/register]', error);

    const message = error?.message || 'Registration failed.';
    const code = error?.code || 'REGISTRATION_FAILED';

    return json(res, 500, {
      success: false,
      error: {
        code,
        message,
      },
    });
  }
}
