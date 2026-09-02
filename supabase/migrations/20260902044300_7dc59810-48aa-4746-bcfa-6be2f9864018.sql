CREATE TABLE public.bot_users (
  telegram_id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL REFERENCES public.bot_users(telegram_id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  portal_token TEXT NOT NULL UNIQUE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ
);

CREATE INDEX idx_enrollments_telegram_id ON public.enrollments (telegram_id);

GRANT ALL ON public.bot_users TO service_role;
GRANT ALL ON public.enrollments TO service_role;

ALTER TABLE public.bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to bot users" ON public.bot_users FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No public access to enrollments" ON public.enrollments FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);