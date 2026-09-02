CREATE TABLE public.support_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.support_config TO service_role;
ALTER TABLE public.support_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.support_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_telegram_id BIGINT NOT NULL,
  sarah_message_id BIGINT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('to_sarah', 'to_member')),
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_messages_member ON public.support_messages (member_telegram_id);
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bot_users ADD COLUMN IF NOT EXISTS chat_with_sarah BOOLEAN NOT NULL DEFAULT false;