-- ============================================================================
-- IgniteX 2026: Payment Proof Storage + Database Index
-- Payment proof images remain as original uploaded files in Supabase Storage.
-- PostgreSQL stores only the storage path and metadata. No encryption/hashing.
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_payment_proofs_registration_id ON public.payment_proofs(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_registration_number ON public.payment_proofs(registration_number);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON public.payment_proofs(status);

CREATE OR REPLACE FUNCTION public.update_payment_proof_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_proofs_updated_at ON public.payment_proofs;
CREATE TRIGGER trg_payment_proofs_updated_at
BEFORE UPDATE ON public.payment_proofs
FOR EACH ROW EXECUTE FUNCTION public.update_payment_proof_timestamp();

-- Keep payment proof status synchronized with the registration decision.
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

ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read payment proofs" ON public.payment_proofs;
CREATE POLICY "Staff read payment proofs" ON public.payment_proofs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN','STAFF')
  )
);

-- The server uses the Supabase service-role client for uploads and signed URLs.
-- No public storage policy is created.
