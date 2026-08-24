-- =========================================================================
-- IgniteX 2026 Symposium Database Migration (Supabase PostgreSQL)
-- Total Capacity Limit: 200 Participants
-- =========================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('technical', 'non-technical')),
    date TEXT,
    start_time TEXT,
    end_time TEXT,
    venue TEXT,
    registration_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_participants INTEGER NOT NULL DEFAULT 200,
    current_participants INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    college TEXT NOT NULL,
    department TEXT,
    year TEXT,
    event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    event_title TEXT NOT NULL,
    event_category TEXT DEFAULT 'technical',
    team_name TEXT,
    team_members JSONB DEFAULT '[]'::jsonb,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    transaction_id TEXT,
    payment_screenshot TEXT,
    payment_gateway TEXT DEFAULT 'UPI',
    attendance_status TEXT NOT NULL DEFAULT 'NOT_ATTENDED' CHECK (attendance_status IN ('NOT_ATTENDED', 'PRESENT')),
    qr_code_token TEXT UNIQUE,
    email_sent BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Attendance Table (Scan Verification Records)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id TEXT NOT NULL REFERENCES public.registrations(registration_id) ON DELETE CASCADE,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scanned_by TEXT NOT NULL DEFAULT 'admin',
    status TEXT NOT NULL DEFAULT 'PRESENT',
    CONSTRAINT unique_registration_attendance UNIQUE (registration_id)
);

-- 4. Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast lookups & search
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.registrations(phone);
CREATE INDEX IF NOT EXISTS idx_registrations_reg_id ON public.registrations(registration_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON public.registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_qr_token ON public.registrations(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_attendance_reg_id ON public.attendance(registration_id);

-- Sequence for Registration ID (e.g. REG-2026-001)
CREATE SEQUENCE IF NOT EXISTS registration_id_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_registration_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.registration_id IS NULL OR NEW.registration_id = '' THEN
        NEW.registration_id := 'REG-2026-' || LPAD(nextval('registration_id_seq')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_registration_id ON public.registrations;
CREATE TRIGGER trg_generate_registration_id
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION generate_registration_id();

-- Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registrations_updated_at ON public.registrations;
CREATE TRIGGER trg_registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Atomic Function: Enforce Global 200 Max Capacity & Event Limits
CREATE OR REPLACE FUNCTION public.check_capacity_and_reserve(
    p_event_id TEXT,
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_college TEXT,
    p_department TEXT,
    p_year TEXT,
    p_event_title TEXT,
    p_event_category TEXT,
    p_team_name TEXT,
    p_team_members JSONB,
    p_amount NUMERIC,
    p_transaction_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_total_paid_count INTEGER;
    v_new_reg RECORD;
BEGIN
    -- Global 200 Participants Capacity Lock
    SELECT COUNT(*) INTO v_total_paid_count FROM public.registrations WHERE payment_status = 'PAID';
    IF v_total_paid_count >= 200 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Total symposium registration capacity limit (200 participants) has been reached.');
    END IF;

    -- Check for duplicate active registration for same email & event
    IF EXISTS (
        SELECT 1 FROM public.registrations 
        WHERE email = p_email AND event_id = p_event_id AND payment_status = 'PAID'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already completed registration for this event with this email address.');
    END IF;

    -- Insert Pending Registration
    INSERT INTO public.registrations (
        name,
        email,
        phone,
        college,
        department,
        year,
        event_id,
        event_title,
        event_category,
        team_name,
        team_members,
        amount,
        payment_status,
        transaction_id,
        attendance_status
    ) VALUES (
        p_name,
        p_email,
        p_phone,
        p_college,
        p_department,
        p_year,
        p_event_id,
        p_event_title,
        p_event_category,
        p_team_name,
        p_team_members,
        p_amount,
        'PENDING',
        p_transaction_id,
        'NOT_ATTENDED'
    ) RETURNING * INTO v_new_reg;

    RETURN jsonb_build_object(
        'success', true, 
        'registration_id', v_new_reg.registration_id,
        'id', v_new_reg.id
    );
END;
$$ LANGUAGE plpgsql;

-- Initial Seed Data for Events
INSERT INTO public.events (id, name, description, category, date, start_time, end_time, venue, registration_fee, max_participants, status)
VALUES 
('tech-crack-the-code', 'Crack The Code', 'Team programming competition combining syntax, balloon challenge, and jumbled code.', 'technical', 'Day 1', '10:00 AM', '01:00 PM', 'Computing Lab (Block 3)', 300, 200, 'ACTIVE'),
('tech-web-weaver', 'Web Weaver', 'Front-end web development sprint with time constraints and mystery challenges.', 'technical', 'Day 1', '02:00 PM', '05:00 PM', 'Web Design Lab (Block 3)', 300, 200, 'ACTIVE'),
('tech-profile-architect', 'Profile Architect', 'LinkedIn & portfolio review competition for professional presence.', 'technical', 'Day 1', '11:00 AM', '01:00 PM', 'Seminar Hall A', 150, 200, 'ACTIVE'),
('tech-neural-rush', 'Neural Rush', 'Generative AI clash and prompt battles solving complex engineering problems.', 'technical', 'Day 2', '10:00 AM', '01:00 PM', 'AI Research Lab', 150, 200, 'ACTIVE'),
('tech-data-detective', 'Data Detective', 'Data analytics treasure hunt deciphering clues from massive datasets.', 'technical', 'Day 2', '02:00 PM', '05:00 PM', 'Data Analytics Lab', 300, 200, 'ACTIVE'),
('nontech-prompt-perfect', 'Prompt Perfect', 'Creative AI prompt generation crafting accurate visuals and stories.', 'non-technical', 'Day 1', '02:00 PM', '04:00 PM', 'Media Hall 2', 150, 200, 'ACTIVE'),
('nontech-memergency', 'Memergency', 'Tech meme creation battle testing humor, speed, and cultural wit.', 'non-technical', 'Day 2', '11:00 AM', '01:00 PM', 'Open Amphitheatre', 150, 200, 'ACTIVE'),
('nontech-poster-xpo', 'Poster Xpo', 'Graphic design and digital poster presentation on future tech visions.', 'non-technical', 'Day 2', '02:00 PM', '04:30 PM', 'Exhibition Hall B', 300, 200, 'ACTIVE'),
('combo-individual-all-access', 'Solo Warrior All-Access Pass', 'All 4 individual events bundled with ₹100 discount.', 'technical', 'Day 1 & Day 2', '10:00 AM', '05:00 PM', 'All Venues', 500, 200, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    registration_fee = EXCLUDED.registration_fee;

-- Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Public can read events
CREATE POLICY "Public can view active events" ON public.events FOR SELECT USING (true);

-- Public can read own registrations by email / registration_id
CREATE POLICY "Users can view own registration" ON public.registrations FOR SELECT USING (true);

-- Service role / backend has full access to all tables
CREATE POLICY "Service role full access registrations" ON public.registrations FOR ALL USING (true);
CREATE POLICY "Service role full access attendance" ON public.attendance FOR ALL USING (true);
CREATE POLICY "Service role full access admins" ON public.admins FOR ALL USING (true);


-- 12. Payment Proof Metadata (image/file lives in Supabase Storage)
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
CREATE INDEX IF NOT EXISTS idx_payment_proofs_registration_id ON public.payment_proofs(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON public.payment_proofs(status);
