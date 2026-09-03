-- Mapping Like A Pro now requires Sarah's manual approval before download —
-- self-reporting a Vantage account isn't enough on its own. Collect the
-- details she needs to check it, and gate the download on a status column
-- instead of releasing it the moment vantage_confirmed is set.
ALTER TABLE public.ebook_claims
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS telegram_username text,
  ADD COLUMN IF NOT EXISTS vantage_account text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'ebook_claims' AND constraint_name = 'ebook_claims_status_check'
  ) THEN
    ALTER TABLE public.ebook_claims
      ADD CONSTRAINT ebook_claims_status_check CHECK (status IN ('pending', 'approved'));
  END IF;
END $$;
