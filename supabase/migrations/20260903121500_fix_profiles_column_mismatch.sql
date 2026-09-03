-- Corrects 20260903120000_purchase_profile_details.sql: that migration's
-- CREATE TABLE public.profiles no-op'd because a profiles table already
-- existed (left over from an earlier abandoned session, applied to the live
-- DB before that session's code was reverted) with a different shape:
-- `id` as the primary key (FK to auth.users), not `user_id`, and it already
-- had telegram_username. This just adds the columns that were actually
-- missing, on the table that actually exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN experience_level text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'capital_range'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN capital_range text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'mt5_account'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN mt5_account text;
  END IF;
END $$;
