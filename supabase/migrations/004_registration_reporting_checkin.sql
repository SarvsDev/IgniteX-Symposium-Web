-- ==============================================================================
-- IGNITEX 2026 - Registration Reporting, Event Counts & Campus Check-in
-- ============================================================================

-- 1. Human-readable public registration ID: IGX-XXXX (4 alphanumeric chars).
--    Verification code and QR token are intentionally stored as PLAINTEXT.
CREATE OR REPLACE FUNCTION generate_next_registration_number()
RETURNS TEXT AS $$
DECLARE
  candidate TEXT;
  chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  i INTEGER;
BEGIN
  -- Serialize ID generation so concurrent registrations cannot receive the same value.
  PERFORM pg_advisory_xact_lock(hashtext('ignitex_2026_registration_number'));
  LOOP
    candidate := 'IGX-';
    FOR i IN 1..4 LOOP
      candidate := candidate || substr(chars, 1 + floor(random() * length(chars))::INTEGER, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM registrations WHERE registration_number = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- No encrypted/hashed registration verification fields are used.
-- Keep verification_code and verification_qr_token directly readable in the DB.
ALTER TABLE registrations DROP COLUMN IF EXISTS verification_code_hash;

-- Convert legacy IDs once so existing registrations also follow IGX-XXXX.
DO $$
DECLARE
  r RECORD;
  new_id TEXT;
BEGIN
  FOR r IN SELECT id FROM registrations WHERE registration_number !~ '^IGX-[A-Z0-9]{4}$' LOOP
    LOOP
      new_id := 'IGX-' || upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 4));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM registrations WHERE registration_number = new_id);
    END LOOP;
    UPDATE registrations SET registration_number = new_id WHERE id = r.id;
  END LOOP;
END $$;

-- 2. Transparent reporting table: one row per participant/event registration.
--    This is deliberately plaintext for admin/reporting use.
CREATE TABLE IF NOT EXISTS participant_event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  registration_number TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  registration_status registration_status NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(registration_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_participant_event_registrations_participant
  ON participant_event_registrations(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_event_registrations_event
  ON participant_event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_participant_event_registrations_status
  ON participant_event_registrations(registration_status);

-- 3. Per-event counters. registered_count = submitted registrations,
--    approved_count = approved/check-in eligible registrations,
--    checked_in_count = participants who actually entered campus.
CREATE TABLE IF NOT EXISTS event_registration_counts (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  registered_count INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
  approved_count INTEGER NOT NULL DEFAULT 0 CHECK (approved_count >= 0),
  checked_in_count INTEGER NOT NULL DEFAULT 0 CHECK (checked_in_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_registration_counts_registered
  ON event_registration_counts(registered_count);

-- 4. Explicit campus check-in record. QR scan is the only source of a check-in.
CREATE TABLE IF NOT EXISTS campus_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by UUID,
  checked_in_by_email TEXT,
  verification_method TEXT NOT NULL DEFAULT 'QR_SCAN' CHECK (verification_method = 'QR_SCAN'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campus_checkins_participant ON campus_checkins(participant_id);
CREATE INDEX IF NOT EXISTS idx_campus_checkins_time ON campus_checkins(checked_in_at);

-- 5. Seed reporting rows for existing events.
INSERT INTO event_registration_counts(event_id)
SELECT id FROM events
ON CONFLICT (event_id) DO NOTHING;

-- 6. Rebuild reporting tables from current data. Safe to run once on migration.
INSERT INTO participant_event_registrations (
  registration_id, participant_id, event_id, registration_number,
  participant_name, event_name, registration_status, registered_at
)
SELECT
  r.id,
  r.participant_id,
  re.event_id,
  r.registration_number,
  p.full_name,
  e.title,
  r.status,
  r.created_at
FROM registrations r
JOIN participants p ON p.id = r.participant_id
JOIN registration_events re ON re.registration_id = r.id
JOIN events e ON e.id = re.event_id
ON CONFLICT (registration_id, event_id) DO UPDATE SET
  participant_name = EXCLUDED.participant_name,
  event_name = EXCLUDED.event_name,
  registration_number = EXCLUDED.registration_number,
  registration_status = EXCLUDED.registration_status,
  updated_at = NOW();

UPDATE event_registration_counts c
SET
  registered_count = COALESCE((SELECT COUNT(*) FROM registration_events re JOIN registrations r ON r.id = re.registration_id WHERE re.event_id = c.event_id AND r.status <> 'CANCELLED'), 0),
  approved_count = COALESCE((SELECT COUNT(*) FROM registration_events re JOIN registrations r ON r.id = re.registration_id WHERE re.event_id = c.event_id AND r.status IN ('APPROVED','CHECKED_IN')), 0),
  checked_in_count = COALESCE((SELECT COUNT(*) FROM registration_events re JOIN registrations r ON r.id = re.registration_id WHERE re.event_id = c.event_id AND r.status = 'CHECKED_IN'), 0),
  updated_at = NOW();

-- 7. Helper to keep event counters synchronized.
CREATE OR REPLACE FUNCTION sync_event_registration_counts(p_event_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO event_registration_counts(event_id, registered_count, approved_count, checked_in_count, updated_at)
  VALUES (
    p_event_id,
    (SELECT COUNT(*) FROM registration_events re JOIN registrations r ON r.id = re.registration_id WHERE re.event_id = p_event_id AND r.status <> 'CANCELLED'),
    (SELECT COUNT(*) FROM registration_events re JOIN registrations r ON r.id = re.registration_id WHERE re.event_id = p_event_id AND r.status IN ('APPROVED','CHECKED_IN')),
    (SELECT COUNT(*) FROM registration_events re JOIN registrations r ON r.id = re.registration_id WHERE re.event_id = p_event_id AND r.status = 'CHECKED_IN'),
    NOW()
  )
  ON CONFLICT(event_id) DO UPDATE SET
    registered_count = EXCLUDED.registered_count,
    approved_count = EXCLUDED.approved_count,
    checked_in_count = EXCLUDED.checked_in_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sync_participant_event_reporting()
RETURNS TRIGGER AS $$
DECLARE
  reg RECORD;
  ev RECORD;
BEGIN
  SELECT * INTO reg FROM registrations WHERE id = NEW.registration_id;
  SELECT * INTO ev FROM events WHERE id = NEW.event_id;

  INSERT INTO participant_event_registrations (
    registration_id, participant_id, event_id, registration_number,
    participant_name, event_name, registration_status, registered_at, updated_at
  )
  SELECT reg.id, reg.participant_id, ev.id, reg.registration_number,
         p.full_name, ev.title, reg.status, reg.created_at, NOW()
  FROM participants p
  WHERE p.id = reg.participant_id
  ON CONFLICT (registration_id, event_id) DO UPDATE SET
    participant_id = EXCLUDED.participant_id,
    registration_number = EXCLUDED.registration_number,
    participant_name = EXCLUDED.participant_name,
    event_name = EXCLUDED.event_name,
    registration_status = EXCLUDED.registration_status,
    updated_at = NOW();

  PERFORM sync_event_registration_counts(NEW.event_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sync_registration_reporting_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE participant_event_registrations
  SET registration_status = NEW.status, updated_at = NOW()
  WHERE registration_id = NEW.id;

  UPDATE campus_checkins
  SET registration_number = NEW.registration_number
  WHERE registration_id = NEW.id;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM sync_event_registration_counts(re.event_id)
    FROM registration_events re
    WHERE re.registration_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_participant_event_reporting ON registration_events;
CREATE TRIGGER trg_sync_participant_event_reporting
AFTER INSERT ON registration_events
FOR EACH ROW EXECUTE FUNCTION sync_participant_event_reporting();

DROP TRIGGER IF EXISTS trg_sync_registration_reporting_status ON registrations;
CREATE TRIGGER trg_sync_registration_reporting_status
AFTER UPDATE OF status ON registrations
FOR EACH ROW EXECUTE FUNCTION sync_registration_reporting_status();

-- 8. Admin/staff-only RLS for transparent reporting data.
ALTER TABLE participant_event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registration_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read participant event reporting" ON participant_event_registrations;
CREATE POLICY "Staff read participant event reporting" ON participant_event_registrations
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN','STAFF')));

DROP POLICY IF EXISTS "Staff read event registration counts" ON event_registration_counts;
CREATE POLICY "Staff read event registration counts" ON event_registration_counts
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN','STAFF')));

DROP POLICY IF EXISTS "Staff read campus checkins" ON campus_checkins;
CREATE POLICY "Staff read campus checkins" ON campus_checkins
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN','STAFF')));

-- Service role writes bypass RLS. Public users do not get direct access to these tables.
