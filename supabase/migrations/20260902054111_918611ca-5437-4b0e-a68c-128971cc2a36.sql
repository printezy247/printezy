ALTER TABLE public.support_messages ALTER COLUMN member_telegram_id DROP NOT NULL;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS web_session_id TEXT;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS display_name TEXT;
CREATE INDEX IF NOT EXISTS idx_support_messages_web ON public.support_messages (web_session_id, id);