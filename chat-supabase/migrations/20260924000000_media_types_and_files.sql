-- ============================================================================
-- 20260924000000_media_types_and_files.sql
--
-- 1) Allow sticker / gif / file message types.
--    ROOT CAUSE: the original check constraint only allowed
--    ('text','image','voice','video'), so every sticker/GIF send was rejected
--    by Postgres with 23514 and silently dropped by the UI.
-- 2) Add file metadata columns for generic file attachments.
-- 3) Composite index so the persistent media gallery can page through ALL
--    historical media (type + timestamp keyset) without scanning text rows.
-- 4) Lift the storage bucket MIME whitelist so documents / archives / any
--    file type can be attached (bucket stays public-read like before).
--
-- Idempotent — safe to re-run.
-- ============================================================================

alter table public.chat_messages
  drop constraint if exists chat_messages_type_check;

alter table public.chat_messages
  add constraint chat_messages_type_check
  check (type = any (array['text','image','voice','video','sticker','gif','file']));

alter table public.chat_messages
  add column if not exists file_name text,
  add column if not exists file_size bigint,
  add column if not exists mime_type text;

create index if not exists chat_messages_media_type_ts_idx
  on public.chat_messages (type, "timestamp" desc)
  where media_url is not null;

-- Storage: accept any file type (was a hard-coded image/audio/video list).
update storage.buckets
   set allowed_mime_types = null
 where id = 'chat-media';
