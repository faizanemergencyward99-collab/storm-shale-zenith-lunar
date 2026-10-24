-- ============================================================================
-- "Our Chat" — NEW project setup. Run this ONCE in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste ALL of this → Run).
-- Creates chat_messages (with media columns), permissive RLS, realtime,
-- the chat-media storage bucket + policies, and game_scores.
-- ============================================================================

-- 1) CHAT MESSAGES TABLE (all columns, text is NULLABLE for media messages)
create table if not exists public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  text          text,
  sender        text not null check (sender in ('habiba','faizan')),
  timestamp     bigint not null,
  session_id    text,
  edited        boolean not null default false,
  created_at    timestamptz not null default now(),
  type          text not null default 'text'
                  check (type in ('text','image','voice','video')),
  media_url     text,
  media_width   integer,
  media_height  integer,
  duration_ms   bigint,
  reply_to_id   uuid,
  reply_snapshot jsonb,
  reactions     jsonb
);

create index if not exists chat_messages_timestamp_idx
  on public.chat_messages (timestamp desc);

-- 2) RLS — permissive (two-person shared journal; anon key protected by passcode UI)
alter table public.chat_messages enable row level security;

drop policy if exists "anon_read_chat"   on public.chat_messages;
drop policy if exists "anon_insert_chat" on public.chat_messages;
drop policy if exists "anon_update_chat" on public.chat_messages;
drop policy if exists "anon_delete_chat" on public.chat_messages;

create policy "anon_read_chat"   on public.chat_messages for select
  to anon, authenticated using (true);
create policy "anon_insert_chat" on public.chat_messages for insert
  to anon, authenticated with check (true);
create policy "anon_update_chat" on public.chat_messages for update
  to anon, authenticated using (true) with check (true);
create policy "anon_delete_chat" on public.chat_messages for delete
  to anon, authenticated using (true);

-- 3) Realtime (live cross-device sync) + full row on UPDATE
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

alter publication supabase_realtime add table public.chat_messages;
alter table public.chat_messages replica identity full;

-- 4) CHAT-MEDIA STORAGE BUCKET (public) — for photos/videos/voice (added later)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media','chat-media', true, 52428800,
  array['image/jpeg','image/png','image/gif','image/webp','image/heic',
        'audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav',
        'video/mp4','video/webm','video/quicktime','video/x-matroska','video/x-m4v','video/3gpp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chat_media_anon_read"   on storage.objects;
drop policy if exists "chat_media_anon_insert" on storage.objects;
drop policy if exists "chat_media_anon_update" on storage.objects;
drop policy if exists "chat_media_anon_delete" on storage.objects;

create policy "chat_media_anon_read"   on storage.objects for select
  to anon, authenticated using (bucket_id = 'chat-media');
create policy "chat_media_anon_insert" on storage.objects for insert
  to anon, authenticated with check (bucket_id = 'chat-media');
create policy "chat_media_anon_update" on storage.objects for update
  to anon, authenticated using (bucket_id = 'chat-media') with check (bucket_id = 'chat-media');
create policy "chat_media_anon_delete" on storage.objects for delete
  to anon, authenticated using (bucket_id = 'chat-media');

-- 5) GAME SCORES (optional feature parity)
create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  player text not null check (player in ('Faizan','Habiba')),
  game_id text not null,
  score integer not null check (score >= 0),
  is_new_record boolean not null default false,
  played_at timestamptz not null default now()
);
alter table public.game_scores enable row level security;
drop policy if exists "anon_all_scores" on public.game_scores;
create policy "anon_all_scores" on public.game_scores for all
  to anon, authenticated using (true) with check (true);
alter publication supabase_realtime add table public.game_scores;
alter table public.game_scores replica identity full;

-- DONE. Tell the migration assistant it's finished and it will import your chats.
