-- Replaces the bare typed-Telegram-handle field with an account profile
-- collected once at checkout and reused/editable on every purchase after.
-- Also carries a full contact record on each purchase (name, email,
-- Telegram, experience, capital range, and MT5 account number when the
-- product needs one) since the website and the real Telegram bot are
-- separate systems (see the 2026-09-03 revert commit) — this is what lets
-- Sarah/Jack manually reconcile a website sale against the bot/license
-- system, the same way USDT and free-tier signups are already handled.

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  telegram_username text,
  experience_level text,
  capital_range text,
  mt5_account text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.site_purchases
  ADD COLUMN full_name text,
  ADD COLUMN experience_level text,
  ADD COLUMN capital_range text,
  ADD COLUMN mt5_account text;
