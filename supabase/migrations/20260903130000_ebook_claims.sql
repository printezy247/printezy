-- Ebook claim gating: sign-in required, Vantage self-report required for
-- "Mapping Like A Pro". Guards the CREATE TABLE itself (not just later
-- ALTER TABLEs) after the profiles table incident, where a CREATE TABLE
-- silently no-op'd against a pre-existing table with a different shape.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ebook_claims'
  ) THEN
    CREATE TABLE public.ebook_claims (
      id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      slug text NOT NULL,
      vantage_confirmed boolean NOT NULL DEFAULT false,
      claimed_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (user_id, slug)
    );
  END IF;
END $$;

GRANT ALL ON public.ebook_claims TO service_role;
ALTER TABLE public.ebook_claims ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ebook_claims'
      AND policyname = 'Users can read their own ebook claims'
  ) THEN
    CREATE POLICY "Users can read their own ebook claims"
      ON public.ebook_claims FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ebook_claims_user_id_idx ON public.ebook_claims (user_id);
