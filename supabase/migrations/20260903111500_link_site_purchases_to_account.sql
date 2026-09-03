-- Step toward account-linked purchases (see .lovable/plan from 2026-09-03):
-- purchases made while signed in are now linked to the account. Guest
-- checkouts (user_id null) keep working exactly as before — this is
-- additive, the Telegram-handle checkout flow is unchanged for now.

ALTER TABLE public.site_purchases
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX site_purchases_user_id_idx ON public.site_purchases (user_id);

CREATE POLICY "Users can read their own purchases"
  ON public.site_purchases
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
