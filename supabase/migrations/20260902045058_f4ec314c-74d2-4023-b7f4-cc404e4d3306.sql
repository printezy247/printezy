CREATE TABLE public.login_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL REFERENCES public.bot_users(telegram_id) ON DELETE CASCADE,
  code text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_codes_telegram_id ON public.login_codes(telegram_id);
GRANT ALL ON public.login_codes TO service_role;
ALTER TABLE public.login_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to login codes" ON public.login_codes FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE TABLE public.member_sessions (
  token text PRIMARY KEY,
  telegram_id bigint NOT NULL REFERENCES public.bot_users(telegram_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX idx_member_sessions_telegram_id ON public.member_sessions(telegram_id);
GRANT ALL ON public.member_sessions TO service_role;
ALTER TABLE public.member_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to member sessions" ON public.member_sessions FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE TABLE public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL REFERENCES public.bot_users(telegram_id) ON DELETE CASCADE,
  symbol text NOT NULL,
  direction text NOT NULL DEFAULT 'buy',
  entry_price numeric,
  exit_price numeric,
  size numeric,
  pips numeric,
  pnl numeric,
  status text NOT NULL DEFAULT 'open',
  notes text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_trades_telegram_id ON public.trades(telegram_id, opened_at DESC);
GRANT ALL ON public.trades TO service_role;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to trades" ON public.trades FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE TABLE public.signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_tier text NOT NULL DEFAULT 'free',
  symbol text NOT NULL,
  direction text NOT NULL DEFAULT 'buy',
  entry_price numeric,
  stop_price numeric,
  target_price numeric,
  status text NOT NULL DEFAULT 'open',
  result_pips numeric,
  note text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_signals_published_at ON public.signals(published_at DESC);
GRANT ALL ON public.signals TO service_role;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to signals" ON public.signals FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

INSERT INTO public.signals (min_tier, symbol, direction, entry_price, stop_price, target_price, status, result_pips, note, published_at) VALUES
  ('free', 'XAUUSD', 'buy', 2412.50, 2405.00, 2431.00, 'win', 185, 'London open continuation off the H1 demand block.', now() - interval '6 days'),
  ('pro', 'EURUSD', 'sell', 1.08420, 1.08760, 1.07850, 'win', 57, 'M5 scalp routine — liquidity sweep then reversal.', now() - interval '4 days'),
  ('premium', 'BTCUSD', 'buy', 61250, 60300, 63800, 'loss', -95, 'Intraday breakout failed on the macro print.', now() - interval '2 days'),
  ('elite', 'GBPJPY', 'sell', 198.420, 199.100, 196.900, 'open', NULL, 'Swing routine — weekly supply retest, runners open.', now() - interval '1 day');