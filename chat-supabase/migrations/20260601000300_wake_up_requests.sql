-- ============================================================================
-- 20260601000300_wake_up_requests.sql
--
-- "Wake Me Up" ⏰ — the database half of the feature.
--
-- WHAT WAS BROKEN:
--   The ⏰ button calls `supabase.rpc("request_wake_up", …)`. That function was
--   never recreated after the project migration, so every tap logged
--   "[wake-up] backend not ready yet: Could not find the function" and the
--   live answer-status overlay could never work. The ring itself still
--   happened (that's Twilio, via the wake-up Edge Function), so the failure
--   was silent — which is exactly why it went unnoticed.
--
-- HOW THE FEATURE FITS TOGETHER (two independent paths, first one wins):
--   1. TWILIO PATH (what actually rings the phone): the browser POSTs to the
--      `wake-up` Edge Function, which places a real call, then polls
--      /wake-up/status every 2s and maps Twilio's call status to the overlay
--      (in-progress|completed → "answered 💗", busy|no-answer|failed → 😴).
--   2. THIS TABLE (the record + the future native-iOS CallKit path): the row
--      is the call's identity — `id` doubles as the CallKit call UUID. The
--      website subscribes to Realtime UPDATEs on it, so when the iOS companion
--      app eventually answers/declines, the overlay updates instantly.
--
-- IDENTITY MODEL: no Supabase Auth. Identity is a persona ('faizan'|'habiba').
-- RLS POSTURE: anon may SELECT (so Realtime can deliver UPDATEs) but never
-- INSERT/UPDATE directly — all writes go through SECURITY DEFINER RPCs.
--
-- SAFE TO RE-RUN. Touches nothing belonging to chat_messages.
-- ============================================================================

-- ── 1) Table ───────────────────────────────────────────────────────────────
create table if not exists public.wake_up_requests (
  id             uuid primary key default gen_random_uuid(), -- = CallKit call UUID
  caller         text not null check (caller    in ('faizan','habiba')),
  recipient      text not null check (recipient in ('faizan','habiba')),
  caller_display text,
  -- 'ringing' is the initial state; every other value is terminal and is what
  -- the website's Realtime handler reacts to.
  status         text not null default 'ringing'
                   check (status in ('ringing','answered','declined',
                                     'expired','failed','ended')),
  call_sid       text,          -- optional Twilio CallSid, for correlation
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- 45s matches the website's local ring timeout exactly.
  expires_at     timestamptz not null default now() + interval '45 seconds',
  answered_at    timestamptz
);

create index if not exists wake_up_requests_recipient_status_idx
  on public.wake_up_requests (recipient, status, created_at desc);

-- ── 2) RLS: read-only to the browser ───────────────────────────────────────
alter table public.wake_up_requests enable row level security;

drop policy if exists "wake_up_anon_read" on public.wake_up_requests;
create policy "wake_up_anon_read"
  on public.wake_up_requests
  for select
  to anon, authenticated
  using (true);
-- Deliberately NO insert/update/delete policies: writes happen only through
-- the SECURITY DEFINER functions below.
--
-- Defence in depth: Supabase grants ALL on public tables to anon by default,
-- leaving RLS as the only gate. Revoking the write privileges means that even
-- if a permissive policy is added here by accident later, anon still cannot
-- INSERT/UPDATE/DELETE. (Note: a blocked UPDATE shows up as PostgREST "204 /
-- 0 rows", whereas a blocked INSERT raises 42501 — both are denials.)
revoke insert, update, delete, truncate on public.wake_up_requests
  from anon, authenticated;
grant select on public.wake_up_requests to anon, authenticated;

-- ── 3) Realtime (the website watches its own call row for UPDATEs) ─────────
-- `alter publication … add table` throws if the table is already a member,
-- so it must be guarded to keep this migration re-runnable.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename  = 'wake_up_requests'
  ) then
    alter publication supabase_realtime add table public.wake_up_requests;
  end if;
end $$;

-- REPLICA IDENTITY FULL is required so the UPDATE payload carries the whole
-- row (the client reads payload.new.status).
alter table public.wake_up_requests replica identity full;

-- ── 4) request_wake_up — called by the ⏰ button ───────────────────────────
-- Returns the new row's uuid, which the website uses as its Realtime filter.
create or replace function public.request_wake_up(
  p_caller         text,
  p_recipient      text,
  p_caller_display text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_caller not in ('faizan','habiba') then
    raise exception 'invalid caller';
  end if;
  if p_recipient not in ('faizan','habiba') then
    raise exception 'invalid recipient';
  end if;
  if p_caller = p_recipient then
    raise exception 'cannot wake yourself up';
  end if;

  -- Housekeeping: retire any ring that already timed out, so a stale 'ringing'
  -- row can never be mistaken for an active call by the (future) iOS app.
  update public.wake_up_requests
     set status = 'expired', updated_at = now()
   where status = 'ringing'
     and expires_at < now();

  insert into public.wake_up_requests (caller, recipient, caller_display)
  values (p_caller, p_recipient, left(coalesce(p_caller_display, ''), 120))
  returning id into v_id;

  return v_id;
end $$;

-- ── 5) update_wake_up_status — used by the iOS app / manual testing ────────
-- Only a currently-'ringing' row may transition, so a late 'ended' can never
-- overwrite an 'answered' outcome.
create or replace function public.update_wake_up_status(
  p_request_id uuid,
  p_status     text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('answered','declined','expired','failed','ended') then
    raise exception 'invalid status';
  end if;

  update public.wake_up_requests
     set status      = p_status,
         updated_at  = now(),
         answered_at = case when p_status = 'answered' then now()
                            else answered_at end
   where id = p_request_id
     and status = 'ringing';
end $$;

-- ── 6) Grants: EXECUTE only ────────────────────────────────────────────────
revoke all on function public.request_wake_up(text,text,text) from public;
revoke all on function public.update_wake_up_status(uuid,text) from public;

grant execute on function public.request_wake_up(text,text,text)
  to anon, authenticated;
grant execute on function public.update_wake_up_status(uuid,text)
  to anon, authenticated;

-- ── 7) Verify ──────────────────────────────────────────────────────────────
-- select id, caller, recipient, status, created_at
--   from public.wake_up_requests order by created_at desc limit 10;
