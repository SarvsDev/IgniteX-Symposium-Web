-- ==============================================================================
-- IGNITEX 2026 SUPABASE POSTGRESQL RELATIONAL DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CHECKED_IN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'FAILED', 'NOT_REQUIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('ADMIN', 'STAFF', 'PARTICIPANT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. EVENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('technical', 'non-technical')),
    day TEXT NOT NULL CHECK (day IN ('Day 1', 'Day 2')),
    event_date DATE,
    start_time TIME,
    end_time TIME,
    time_display TEXT,
    venue TEXT NOT NULL,
    entry_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    prize_pool TEXT,
    max_capacity INTEGER NOT NULL DEFAULT 100,
    current_capacity INTEGER NOT NULL DEFAULT 0,
    min_team_size INTEGER NOT NULL DEFAULT 1,
    max_team_size INTEGER NOT NULL DEFAULT 1,
    is_team_event BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rules JSONB DEFAULT '[]'::jsonb,
    rule_book JSONB DEFAULT '{}'::jsonb,
    coordinators JSONB DEFAULT '[]'::jsonb,
    icon_name TEXT DEFAULT 'Code',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);

-- ------------------------------------------------------------------------------
-- 3. EVENT COMBOS & COMBO EVENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    badge TEXT,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2) NOT NULL,
    savings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rules JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS combo_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES event_combos(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(combo_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_combo_events_combo_id ON combo_events(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_events_event_id ON combo_events(event_id);

-- ------------------------------------------------------------------------------
-- 4. PARTICIPANTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    college TEXT,
    department TEXT,
    college_year TEXT,
    auth_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_participants_phone ON participants(phone);

-- ------------------------------------------------------------------------------
-- 5. REGISTRATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number TEXT UNIQUE NOT NULL,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
    status registration_status NOT NULL DEFAULT 'PENDING',
    payment_status payment_status_type NOT NULL DEFAULT 'SUBMITTED',
    payment_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_gateway TEXT DEFAULT 'BANK_TRANSFER',
    transaction_id TEXT,
    payment_screenshot_url TEXT,
    registration_source TEXT DEFAULT 'website',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    approved_by UUID,
    rejection_reason TEXT,
    verification_code TEXT UNIQUE,
    verification_qr_token TEXT UNIQUE,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    receipt_number TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registrations_participant_id ON registrations(participant_id);
CREATE INDEX IF NOT EXISTS idx_registrations_reg_number ON registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_registrations_verification_code ON registrations(verification_code);
CREATE INDEX IF NOT EXISTS idx_registrations_qr_token ON registrations(verification_qr_token);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);

-- ------------------------------------------------------------------------------
-- 6. REGISTRATION EVENTS TABLE (Normalized Multi-Event Mapping)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    price_at_registration NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(registration_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_reg_events_registration_id ON registration_events(registration_id);
CREATE INDEX IF NOT EXISTS idx_reg_events_event_id ON registration_events(event_id);

-- ------------------------------------------------------------------------------
-- 7. TEAMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    team_name TEXT NOT NULL,
    team_leader_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(registration_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_teams_registration_id ON teams(registration_id);
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);

-- ------------------------------------------------------------------------------
-- 8. TEAM MEMBERS TABLE (Normalized Members List)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    member_name TEXT NOT NULL,
    member_email TEXT,
    member_phone TEXT,
    is_leader BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(LOWER(member_email));

-- ------------------------------------------------------------------------------
-- 9. USER PROFILES / RBAC TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role_type NOT NULL DEFAULT 'PARTICIPANT',
    phone TEXT,
    college TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ------------------------------------------------------------------------------
-- 10. EMAIL LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    email_type TEXT NOT NULL, -- REGISTRATION_RECEIVED, REGISTRATION_APPROVED, REGISTRATION_REJECTED, REGISTRATION_RESEND
    resend_message_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- SENT, DELIVERED, FAILED, SIMULATED
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_reg_id ON email_logs(registration_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(LOWER(recipient_email));

-- ------------------------------------------------------------------------------
-- 11. ADMIN AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID,
    admin_email TEXT,
    action TEXT NOT NULL, -- REGISTRATION_APPROVED, REGISTRATION_REJECTED, EMAIL_RESENT, REGISTRATION_CHECKED_IN, REGISTRATION_UPDATED
    registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_reg_id ON admin_audit_logs(registration_id);

-- ------------------------------------------------------------------------------
-- 12. AUTOMATIC UPDATED_AT TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE set_updated_at_column();

DROP TRIGGER IF EXISTS trg_participants_updated_at ON participants;
CREATE TRIGGER trg_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE PROCEDURE set_updated_at_column();

DROP TRIGGER IF EXISTS trg_registrations_updated_at ON registrations;
CREATE TRIGGER trg_registrations_updated_at BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE PROCEDURE set_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at_column();

-- ------------------------------------------------------------------------------
-- 13. HUMAN REGISTRATION ID GENERATOR: IGX-XXXX
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_next_registration_number()
RETURNS TEXT AS $$
DECLARE
    candidate TEXT;
    chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    bytes BYTEA;
    i INTEGER;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('ignitex-2026-registration-id'));
    LOOP
        bytes := gen_random_bytes(4);
        candidate := 'IGX-';
        FOR i IN 0..3 LOOP
            candidate := candidate || substr(chars, 1 + (get_byte(bytes, i) % 36), 1);
        END LOOP;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.registrations WHERE registration_number = candidate);
    END LOOP;
    RETURN candidate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.generate_next_registration_number() TO service_role;

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Public can read active events and combos
CREATE POLICY "Public read active events" ON events FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active combos" ON event_combos FOR SELECT USING (is_active = true);
CREATE POLICY "Public read combo_events" ON combo_events FOR SELECT USING (true);

-- Authenticated users can read their own profile, staff/admin can read all profiles
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Service role / Edge Functions have full bypass privileges for inserts/updates
-- Admin/Staff policies via custom claims or profile role
CREATE POLICY "Staff read all registrations" ON registrations FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'STAFF'))
);

CREATE POLICY "Staff read all participants" ON participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'STAFF'))
);

-- ==============================================================================
-- IGNITEX 2026 EVENT SEED DATA
-- Migration: 002_seed_events.sql
-- ==============================================================================

-- 1. Insert 9 Core Events
INSERT INTO events (
    slug,
    title,
    tagline,
    description,
    category,
    day,
    event_date,
    start_time,
    end_time,
    time_display,
    venue,
    entry_fee,
    prize_pool,
    max_capacity,
    current_capacity,
    min_team_size,
    max_team_size,
    is_team_event,
    is_active,
    icon_name
) VALUES 
(
    'tech-crack-the-code',
    'Crack The Code',
    'Team-based programming competition combining fundamentals, balloon challenge, and jumbled code.',
    'Three progressive rounds testing syntax, communication, problem-solving, and jumbled logic under time pressure.',
    'technical',
    'Day 1',
    '2026-03-27',
    '10:00:00',
    '13:00:00',
    '10:00 AM - 01:00 PM',
    'Lab (Computer Lab)',
    300.00,
    '1st, 2nd & 3rd Cash Prizes + Merit Certificates',
    80,
    0,
    2,
    2,
    true,
    true,
    'Code'
),
(
    'tech-neural-rush',
    'Neural Rush (Gen AI Clash)',
    '4-Level individual AI tech quiz, AI vs. Human detection, logic vault, and rapid-fire finals.',
    'Multi-level challenge from Byte Rush quiz to AI Detective detection, AI Vault puzzles, and high-pressure finals.',
    'technical',
    'Day 1',
    '2026-03-27',
    '10:00:00',
    '01:00:00',
    '10:00 AM - 01:00 PM',
    'Classroom / Seminar Hall (Audio-Visual equipped)',
    150.00,
    '1st, 2nd & 3rd Cash Prizes + Merit Certificates',
    100,
    0,
    1,
    1,
    false,
    true,
    'BrainCircuit'
),
(
    'tech-poster-xpo',
    'Poster Xpo',
    'Technical research poster presentation and idea showcase in emerging computer technologies.',
    'Present innovative posters on AI, IoT, Blockchain, Cybersecurity, and Cloud to a panel of expert judges.',
    'technical',
    'Day 1',
    '2026-03-27',
    '10:00:00',
    '01:00:00',
    '10:00 AM - 01:00 PM',
    'Seminar Hall / Poster Exhibition Area',
    300.00,
    '1st, 2nd & 3rd Cash Prizes + Merit Certificates',
    60,
    0,
    1,
    3,
    true,
    true,
    'FileText'
),
(
    'tech-profile-architect',
    'Profile Architect',
    'Live web and UI/UX design challenge to engineer a responsive, interactive personal portfolio website.',
    'Build and deploy a live portfolio web project showcasing responsive styling, design aesthetics, and modern web frameworks.',
    'technical',
    'Day 2',
    '2026-03-28',
    '10:00:00',
    '01:00:00',
    '10:00 AM - 01:00 PM',
    'Computer Lab 2',
    150.00,
    '1st, 2nd & 3rd Cash Prizes + Merit Certificates',
    80,
    0,
    1,
    1,
    false,
    true,
    'Cpu'
),
(
    'tech-zero-final-key',
    'Zero Hour: Final Key',
    'High-pressure technical problem solving, blind debugging relay, and multi-stage logic escape challenge.',
    'Teams race against a ticking countdown to unlock algorithmic clues, debug broken codebases, and decrypt the master key.',
    'technical',
    'Day 2',
    '2026-03-28',
    '10:00:00',
    '01:00:00',
    '10:00 AM - 01:00 PM',
    'Main Computer Centre',
    300.00,
    '1st, 2nd & 3rd Cash Prizes + Merit Certificates',
    70,
    0,
    2,
    2,
    true,
    true,
    'Terminal'
),
(
    'nontech-operation-bermuda',
    'Operation Bermuda',
    'Campus-wide tactical problem solving, clue decryption, logic puzzles, and team treasure hunt.',
    'Solve encrypted riddles across college checkpoints, decipher cryptographic coordinates, and secure the ultimate symposium relic.',
    'non-technical',
    'Day 1',
    '2026-03-27',
    '10:00:00',
    '01:00:00',
    '10:00 AM - 01:00 PM',
    'Campus Open Grounds & Auditorium Area',
    300.00,
    '1st, 2nd & 3rd Cash Prizes + Merit Certificates',
    100,
    0,
    2,
    3,
    true,
    true,
    'Compass'
),
(
    'nontech-memergency',
    'Memergency',
    'Meme creation, brand viral marketing, creative strategy, and cultural defense presentation.',
    'Fast-paced creative battle testing humor, graphic design, social media trends, and persuasive marketing agility.',
    'non-technical',
    'Day 1',
    '2026-03-27',
    '10:00:00',
    '01:00:00',
    '10:00 AM - 01:00 PM',
    'AV Room / Media Hall',
    150.00,
    '1st, 2nd & 3rd Cash Prizes + Merit Certificates',
    80,
    0,
    1,
    1,
    false,
    true,
    'Smile'
),
(
    'nontech-prompt-perfect',
    'Prompt Perfect',
    'AI prompt engineering, generative image reconstruction, multi-modal synthesis, and speed generation.',
    'Test your creative mastery of large language models and diffusion models to replicate complex images and code snippets.',
    'non-technical',
    'Day 2',
    '2026-03-28',
    '10:00:00',
    '01:00:00',
    '10:00 AM - 01:00 PM',
    'Multimedia Lab',
    150.00,
    '1st, 2nd & 3rd Cash Prizes + Merit Certificates',
    80,
    0,
    1,
    1,
    false,
    true,
    'Sparkles'
),
(
    'nontech-pitch-desk',
    'Pitch Desk',
    'Startup idea pitch, business model generation, investor presentation, and shark tank Q&A.',
    'Pitch revolutionary product ideas, monetization models, and market viability to venture mentors and startup founders.',
    'non-technical',
    'Day 2',
    '2026-03-28',
    '10:00:00',
    '01:00:00',
    '10:00 AM - 01:00 PM',
    'Conference Hall',
    300.00,
    '1st, 2nd & 3rd Cash Prizes + Merit Certificates',
    60,
    0,
    1,
    3,
    true,
    true,
    'Briefcase'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    entry_fee = EXCLUDED.entry_fee,
    max_team_size = EXCLUDED.max_team_size,
    is_team_event = EXCLUDED.is_team_event,
    venue = EXCLUDED.venue;

-- 2. Insert All Individual Events Access Combo Pass
INSERT INTO event_combos (
    slug,
    name,
    description,
    badge,
    price,
    original_price,
    savings,
    is_active
) VALUES (
    'combo-individual-all-access',
    'All Individual Events Access Pass',
    'One single all-access pass for ₹500 that grants complete official entry to all four individual events across both days: Profile Architect, Neural Rush (Gen AI Clash), Prompt Perfect, and Memergency.',
    'ALL INDIVIDUAL EVENTS COMBO',
    500.00,
    600.00,
    100.00,
    true
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Link Combo Events
INSERT INTO combo_events (combo_id, event_id)
SELECT c.id, e.id
FROM event_combos c, events e
WHERE c.slug = 'combo-individual-all-access'
  AND e.slug IN ('tech-profile-architect', 'tech-neural-rush', 'nontech-prompt-perfect', 'nontech-memergency')
ON CONFLICT (combo_id, event_id) DO NOTHING;



-- ==============================================================================
-- 15. PAYMENT PROOF STORAGE
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
    registration_number TEXT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'payment-proofs',
    storage_path TEXT NOT NULL UNIQUE,
    original_file_name TEXT,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','VERIFIED','REJECTED')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_registration ON public.payment_proofs(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_registration_number ON public.payment_proofs(registration_number);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON public.payment_proofs(status);

DROP TRIGGER IF EXISTS trg_payment_proofs_updated_at ON public.payment_proofs;
CREATE TRIGGER trg_payment_proofs_updated_at
BEFORE UPDATE ON public.payment_proofs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();

-- ==============================================================================
-- 16. TRANSPARENT PARTICIPANT/EVENT REPORTING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.participant_event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    registration_number TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    event_name TEXT NOT NULL,
    registration_status registration_status NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(registration_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_participant_event_participant ON public.participant_event_registrations(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_event_event ON public.participant_event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_participant_event_status ON public.participant_event_registrations(registration_status);

-- ==============================================================================
-- 17. PER-EVENT REGISTRATION COUNTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.event_registration_counts (
    event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
    registered_count INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
    approved_count INTEGER NOT NULL DEFAULT 0 CHECK (approved_count >= 0),
    checked_in_count INTEGER NOT NULL DEFAULT 0 CHECK (checked_in_count >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_registration_counts_registered ON public.event_registration_counts(registered_count DESC);

INSERT INTO public.event_registration_counts(event_id)
SELECT id FROM public.events
ON CONFLICT (event_id) DO NOTHING;

-- ==============================================================================
-- 18. CAMPUS CHECK-IN
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.campus_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
    registration_number TEXT NOT NULL,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checked_in_by UUID,
    checked_in_by_email TEXT,
    verification_method TEXT NOT NULL DEFAULT 'QR_SCAN' CHECK (verification_method = 'QR_SCAN'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campus_checkins_registration ON public.campus_checkins(registration_id);
CREATE INDEX IF NOT EXISTS idx_campus_checkins_participant ON public.campus_checkins(participant_id);
CREATE INDEX IF NOT EXISTS idx_campus_checkins_time ON public.campus_checkins(checked_in_at DESC);

-- ==============================================================================
-- 19. REPORTING + COUNTER SYNCHRONIZATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_event_registration_counts(p_event_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.event_registration_counts(event_id, registered_count, approved_count, checked_in_count, updated_at)
    SELECT
        p_event_id,
        COUNT(*) FILTER (WHERE r.status IN ('PENDING','APPROVED','CHECKED_IN'))::INTEGER,
        COUNT(*) FILTER (WHERE r.status IN ('APPROVED','CHECKED_IN'))::INTEGER,
        COUNT(*) FILTER (WHERE r.status = 'CHECKED_IN')::INTEGER,
        NOW()
    FROM public.registration_events re
    JOIN public.registrations r ON r.id = re.registration_id
    WHERE re.event_id = p_event_id
    ON CONFLICT (event_id) DO UPDATE SET
        registered_count = EXCLUDED.registered_count,
        approved_count = EXCLUDED.approved_count,
        checked_in_count = EXCLUDED.checked_in_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_participant_event_row()
RETURNS TRIGGER AS $$
DECLARE
    reg_row RECORD;
    event_row RECORD;
BEGIN
    SELECT reg.*, p.full_name AS participant_name INTO reg_row
    FROM public.registrations reg
    JOIN public.participants p ON p.id = reg.participant_id
    WHERE reg.id = NEW.registration_id;

    SELECT * INTO event_row FROM public.events WHERE id = NEW.event_id;

    INSERT INTO public.participant_event_registrations (
        registration_id, participant_id, event_id, registration_number,
        participant_name, event_name, registration_status, registered_at, updated_at
    ) VALUES (
        reg_row.id, reg_row.participant_id, event_row.id, reg_row.registration_number,
        reg_row.participant_name, event_row.title, reg_row.status, reg_row.created_at, NOW()
    )
    ON CONFLICT (registration_id, event_id) DO UPDATE SET
        registration_number = EXCLUDED.registration_number,
        participant_name = EXCLUDED.participant_name,
        event_name = EXCLUDED.event_name,
        registration_status = EXCLUDED.registration_status,
        updated_at = NOW();

    PERFORM public.sync_event_registration_counts(NEW.event_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_registration_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.participant_event_registrations
    SET registration_status = NEW.status, registration_number = NEW.registration_number, updated_at = NOW()
    WHERE registration_id = NEW.id;

    UPDATE public.campus_checkins
    SET registration_number = NEW.registration_number
    WHERE registration_id = NEW.id;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
        PERFORM public.sync_event_registration_counts(re.event_id)
        FROM public.registration_events re
        WHERE re.registration_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_participant_event_row ON public.registration_events;
CREATE TRIGGER trg_sync_participant_event_row
AFTER INSERT ON public.registration_events
FOR EACH ROW EXECUTE FUNCTION public.sync_participant_event_row();

DROP TRIGGER IF EXISTS trg_sync_registration_status ON public.registrations;
CREATE TRIGGER trg_sync_registration_status
AFTER UPDATE OF status ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.sync_registration_status();

-- Rebuild report/count rows from whatever is inserted by the seed/schema.
INSERT INTO public.participant_event_registrations (
    registration_id, participant_id, event_id, registration_number,
    participant_name, event_name, registration_status, registered_at
)
SELECT r.id, r.participant_id, re.event_id, r.registration_number,
       p.full_name, e.title, r.status, r.created_at
FROM public.registrations r
JOIN public.participants p ON p.id = r.participant_id
JOIN public.registration_events re ON re.registration_id = r.id
JOIN public.events e ON e.id = re.event_id
ON CONFLICT (registration_id, event_id) DO UPDATE SET
    registration_number = EXCLUDED.registration_number,
    participant_name = EXCLUDED.participant_name,
    event_name = EXCLUDED.event_name,
    registration_status = EXCLUDED.registration_status,
    updated_at = NOW();

DO $$
DECLARE e RECORD;
BEGIN
    FOR e IN SELECT id FROM public.events LOOP
        PERFORM public.sync_event_registration_counts(e.id);
    END LOOP;
END $$;

-- ==============================================================================
-- 20. IDEMPOTENT QR CHECK-IN FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_in_registration(
    p_registration_id UUID,
    p_staff_id UUID DEFAULT NULL,
    p_staff_email TEXT DEFAULT 'admin@ignitex.edu'
)
RETURNS JSONB AS $$
DECLARE
    r RECORD;
    c RECORD;
    checkin_time TIMESTAMPTZ;
BEGIN
    SELECT * INTO r FROM public.registrations WHERE id = p_registration_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'status', 'INVALID', 'message', 'Registration not found.');
    END IF;

    IF r.status = 'CHECKED_IN' THEN
        SELECT * INTO c FROM public.campus_checkins WHERE registration_id = r.id;
        RETURN jsonb_build_object(
            'success', true,
            'status', 'ALREADY_CHECKED_IN',
            'message', 'Participant is already checked in.',
            'checked_in', true,
            'checked_in_at', c.checked_in_at
        );
    END IF;

    IF r.status <> 'APPROVED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', r.status::TEXT,
            'message', 'Only APPROVED registrations can be checked in.',
            'checked_in', false
        );
    END IF;

    checkin_time := NOW();

    UPDATE public.registrations
    SET status = 'CHECKED_IN',
        verified_at = checkin_time,
        verified_by = p_staff_id,
        updated_at = checkin_time
    WHERE id = r.id AND status = 'APPROVED';

    IF NOT FOUND THEN
        SELECT * INTO c FROM public.campus_checkins WHERE registration_id = r.id;
        RETURN jsonb_build_object('success', true, 'status', 'ALREADY_CHECKED_IN', 'message', 'Participant was checked in by another staff member.', 'checked_in', true, 'checked_in_at', c.checked_in_at);
    END IF;

    INSERT INTO public.campus_checkins (
        registration_id, registration_number, participant_id, checked_in_at, checked_in_by, checked_in_by_email, verification_method
    ) VALUES (
        r.id, r.registration_number, r.participant_id, checkin_time, p_staff_id, COALESCE(NULLIF(p_staff_email, ''), 'admin@ignitex.edu'), 'QR_SCAN'
    )
    ON CONFLICT (registration_id) DO NOTHING;

    INSERT INTO public.admin_audit_logs (admin_id, admin_email, action, registration_id, metadata)
    VALUES (p_staff_id, COALESCE(NULLIF(p_staff_email, ''), 'admin@ignitex.edu'), 'REGISTRATION_CHECKED_IN', r.id, jsonb_build_object('checkin_time', checkin_time, 'verification_method', 'QR_SCAN'));

    RETURN jsonb_build_object('success', true, 'status', 'CHECKED_IN', 'message', 'Participant checked in successfully.', 'checked_in', true, 'checked_in_at', checkin_time);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_in_registration(UUID, UUID, TEXT) TO service_role;

-- ==============================================================================
-- 21. PAYMENT PROOF STATUS SYNCHRONIZATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_payment_proof_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'APPROVED' THEN
        UPDATE public.payment_proofs
        SET status = 'VERIFIED', verified_at = COALESCE(verified_at, NOW()), verified_by = NEW.approved_by, updated_at = NOW()
        WHERE registration_id = NEW.id;
    ELSIF NEW.status = 'REJECTED' THEN
        UPDATE public.payment_proofs
        SET status = 'REJECTED', updated_at = NOW()
        WHERE registration_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_payment_proof_status ON public.registrations;
CREATE TRIGGER trg_sync_payment_proof_status
AFTER UPDATE OF status ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.sync_payment_proof_status();

-- ==============================================================================
-- 22. RLS FOR NEW TABLES
-- ==============================================================================
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registration_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read payment proofs" ON public.payment_proofs
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN','STAFF')));

CREATE POLICY "Staff read participant event report" ON public.participant_event_registrations
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN','STAFF')));

CREATE POLICY "Staff read event counts" ON public.event_registration_counts
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN','STAFF')));

CREATE POLICY "Staff read campus checkins" ON public.campus_checkins
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN','STAFF')));

-- ==============================================================================
-- 23. STORAGE POLICIES
-- ==============================================================================
-- The application uses the Supabase service-role client for upload and signed URLs.
-- The bucket is private; this is access control, not database encryption.
