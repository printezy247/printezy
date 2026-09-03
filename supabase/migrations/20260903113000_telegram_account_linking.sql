-- Telegram account-linking: lets a signed-in website user connect their
-- Telegram account via a one-time code, instead of typing a raw handle.
-- See .lovable/plan (2026-09-03) — this is the linking half of that plan;
-- checkout still collects the typed handle for now.

CREATE TABLE public.account_telegram_links (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id bigint NOT NULL UNIQUE,
  telegram_username text,
  linked_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.account_telegram_links TO service_role;
ALTER TABLE public.account_telegram_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own telegram link"
  ON public.account_telegram_links
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Short-lived, single-use codes minted by a signed-in user and consumed by
-- the bot webhook. Only the server (service_role) ever touches this table
-- directly, so it carries no anon/authenticated policies.
CREATE TABLE public.telegram_link_codes (
  code text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.telegram_link_codes TO service_role;
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;
