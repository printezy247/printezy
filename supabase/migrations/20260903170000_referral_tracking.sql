-- Referral tracking: each signed-in user gets a stable code; profiles record
-- who referred them (set once, never overwritten). Rewards are handled
-- manually by Sarah on notification, not automated here.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'referral_codes'
  ) THEN
    CREATE TABLE public.referral_codes (
      user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      code text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'referral_codes'
      AND policyname = 'Users can read their own referral code'
  ) THEN
    CREATE POLICY "Users can read their own referral code"
      ON public.referral_codes FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by text;

CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles (referred_by);
