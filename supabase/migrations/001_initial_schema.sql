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
    payment_gateway TEXT DEFAULT 'UPI',
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
-- 13. SEQUENTIAL REGISTRATION NUMBER GENERATOR
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS symposium_reg_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_next_registration_number()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
BEGIN
    next_val := nextval('symposium_reg_seq');
    RETURN 'IGX-' || LPAD(next_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

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
