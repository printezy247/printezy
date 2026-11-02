-- Track the Telegram source of each autopilot push for DB-level dedup.
-- external_id stays the idempotency key. When the bot forwards the origin
-- chat/message, the pair is unique: the same Telegram message cannot create
-- two cards even across processes. NULLs are allowed for older rows and
-- non-Telegram pushes, so the partial unique index only applies when both
-- halves are present.
alter table public.ezyai_signals
  add column if not exists source_channel_id bigint,
  add column if not exists source_message_id bigint;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'ezyai_signals_source_unique'
  ) then
    create unique index ezyai_signals_source_unique
      on public.ezyai_signals (source_channel_id, source_message_id)
      where source_channel_id is not null and source_message_id is not null;
  end if;
end
$$;

create index if not exists idx_ezyai_signals_source_channel
  on public.ezyai_signals (source_channel_id);
