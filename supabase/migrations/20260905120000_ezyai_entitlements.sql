-- EzyAI PRO sold through the website's Stripe checkout.
--
-- The @ezytradeai_bot (repo tradernonymous/EzyAi) keeps its own plan state
-- and only knows a buyer's numeric Telegram id once they talk to it. The
-- website only knows the handle typed at checkout. This table is the bridge:
-- the payments webhook writes one row per paid EzyAI SKU, and the bot claims
-- rows for a handle via /api/public/ezyai/entitlements (bearer-key auth),
-- activating PRO and stamping telegram_id + claimed_at.
CREATE TABLE IF NOT EXISTS public.ezyai_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  months INTEGER NOT NULL CHECK (months > 0),
  telegram_username TEXT NOT NULL,          -- lowercased, no leading @
  telegram_id BIGINT,                       -- filled in when the bot claims it
  email TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_session_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'claimed', 'revoked')),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service-role only: the bot talks to our server route, never to Supabase.
ALTER TABLE public.ezyai_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ezyai_entitlements FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ezyai_entitlements TO service_role;

CREATE INDEX IF NOT EXISTS ezyai_entitlements_username_idx
  ON public.ezyai_entitlements (lower(telegram_username));
CREATE INDEX IF NOT EXISTS ezyai_entitlements_unclaimed_idx
  ON public.ezyai_entitlements (created_at)
  WHERE claimed_at IS NULL AND status = 'paid';
