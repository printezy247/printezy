alter table public.ezyai_entitlements
  add column if not exists redeem_code_hash text;

create index if not exists ezyai_entitlements_redeem_hash_idx
  on public.ezyai_entitlements (redeem_code_hash)
  where redeem_code_hash is not null;

create table if not exists public.ezyai_redeem_audit (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null references public.ezyai_entitlements(id) on delete cascade,
  telegram_id bigint not null,
  claimed_at timestamptz not null default now()
);

grant all on public.ezyai_redeem_audit to service_role;
alter table public.ezyai_redeem_audit enable row level security;
revoke all on public.ezyai_redeem_audit from public, anon, authenticated;

create index if not exists ezyai_redeem_audit_entitlement_idx
  on public.ezyai_redeem_audit (entitlement_id);
create index if not exists ezyai_redeem_audit_telegram_idx
  on public.ezyai_redeem_audit (telegram_id);