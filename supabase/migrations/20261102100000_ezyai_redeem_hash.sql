-- Redeem codes are bearer secrets: store a SHA-256 hash for lookup and keep
-- an audit trail of claims. Plaintext redeem_code is retained during the
-- transition for rows minted before hashing, then backfilled lazily by the
-- server on next read. New rows always write both code and hash.
alter table public.ezyai_entitlements
  add column if not exists redeem_code_hash text;

create index if not exists ezyai_entitlements_redeem_hash_idx
  on public.ezyai_entitlements (redeem_code_hash)
  where redeem_code_hash is not null;

-- Every successful claim leaves one row: who claimed what, when.
create table if not exists public.ezyai_redeem_audit (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null references public.ezyai_entitlements(id) on delete cascade,
  telegram_id bigint not null,
  claimed_at timestamptz not null default now()
);

alter table public.ezyai_redeem_audit enable row level security;
revoke all on public.ezyai_redeem_audit from public, anon, authenticated;
grant all on public.ezyai_redeem_audit to service_role;

create index if not exists ezyai_redeem_audit_entitlement_idx
  on public.ezyai_redeem_audit (entitlement_id);
create index if not exists ezyai_redeem_audit_telegram_idx
  on public.ezyai_redeem_audit (telegram_id);
