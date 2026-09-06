-- One human-typeable code per EzyAI PRO entitlement (EZY-XXXX-XXXX), so a
-- buyer whose Telegram handle didn't match can still activate with
-- /redeem in @ezytradeai_bot. Minted at checkout and written by the webhook.
ALTER TABLE public.ezyai_entitlements
  ADD COLUMN IF NOT EXISTS redeem_code TEXT UNIQUE;
