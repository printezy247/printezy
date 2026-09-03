CREATE TABLE public.site_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL,
  telegram_username TEXT,
  email TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'paid',
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent TEXT,
  granted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.site_purchases TO service_role;

ALTER TABLE public.site_purchases ENABLE ROW LEVEL SECURITY;

CREATE INDEX site_purchases_telegram_username_idx ON public.site_purchases (lower(telegram_username));