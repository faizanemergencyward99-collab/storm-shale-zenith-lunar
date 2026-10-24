-- ============================================================================
-- 20260601000000_music_bucket.sql
--
-- "Our Songs 🎵" — storage wiring for the music/song section.
--
-- WHY THIS IS REQUIRED:
--   A *public* bucket lets anyone STREAM a file when they already know its
--   exact URL. It does NOT let the browser LIST the bucket's contents —
--   storage.objects has Row-Level Security enabled, and `supabase.storage
--   .from('music').list()` runs a SELECT against it. With no SELECT policy the
--   list silently returns an EMPTY ARRAY (not an error), so the song page shows
--   "No songs found yet 🎶" even though your MP3s uploaded perfectly fine.
--
--   This migration is what makes the songs actually appear.
--
-- SAFE TO RE-RUN: fully idempotent, and it never touches the chat-media
-- bucket, its policies, or any chat data.
-- ============================================================================

-- ── 1) The bucket itself ────────────────────────────────────────────────────
-- Public = songs stream straight from the CDN with no signed URLs (fast, and
-- lets the browser prefetch the next track). Non-destructive on conflict: if
-- you already created the bucket in the dashboard we only ensure it's public
-- and leave your size/MIME settings exactly as you configured them.
insert into storage.buckets (id, name, public, file_size_limit)
values ('music', 'music', true, 52428800)  -- 50 MB ceiling per song
on conflict (id) do update
  set public = true;  -- only flip it public; your size/MIME settings are kept

-- If the bucket already existed WITHOUT a size limit, give it a sane one.
update storage.buckets
   set file_size_limit = 52428800
 where id = 'music'
   and file_size_limit is null;

-- ── 2) Read + LIST policy for the browser ───────────────────────────────────
-- Uniquely named so it can never collide with the chat-media policies.
drop policy if exists "music_anon_read" on storage.objects;

create policy "music_anon_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'music');

-- ── 3) OPTIONAL: let the app upload/delete songs from the browser ───────────
-- Left commented ON PURPOSE. You upload songs from the Supabase dashboard
-- (service role bypasses RLS), so the music library stays read-only to the
-- browser and a stranger with the public anon key cannot wipe your songs.
-- Uncomment only if you ever add an in-app "upload song" button.
--
-- create policy "music_anon_insert" on storage.objects for insert
--   to anon, authenticated with check (bucket_id = 'music');
-- create policy "music_anon_delete" on storage.objects for delete
--   to anon, authenticated using (bucket_id = 'music');

-- ── 4) Verify (should list your uploaded songs) ─────────────────────────────
-- select name, round((metadata->>'size')::numeric / 1048576, 2) as mb
--   from storage.objects
--  where bucket_id = 'music'
--  order by name;
