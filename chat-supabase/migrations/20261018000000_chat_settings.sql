-- Shared chat settings: theme + "Seen" receipts (applied 2026-10-18).
create table if not exists public.chat_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.chat_settings enable row level security;
drop policy if exists chat_settings_read on public.chat_settings;
drop policy if exists chat_settings_insert on public.chat_settings;
drop policy if exists chat_settings_update on public.chat_settings;
create policy chat_settings_read on public.chat_settings for select to anon, authenticated using (true);
create policy chat_settings_insert on public.chat_settings for insert to anon, authenticated
  with check (key in ('theme', 'seen_faizan', 'seen_habiba'));
create policy chat_settings_update on public.chat_settings for update to anon, authenticated
  using (key in ('theme', 'seen_faizan', 'seen_habiba'))
  with check (key in ('theme', 'seen_faizan', 'seen_habiba'));
grant select, insert, update on public.chat_settings to anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chat_settings') then
    alter publication supabase_realtime add table public.chat_settings;
  end if;
end $$;
