-- 20260927000000_push_presence.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- "Don't notify me while I'm IN the app" — per-device foreground presence.
--
-- WHY SERVER-SIDE: the service worker already tries to suppress banners when a
-- visible window exists, but iOS home-screen web apps frequently return an
-- EMPTY clients.matchAll() inside the push event, so the banner shows anyway.
-- Apple also revokes subscriptions that swallow pushes silently. The reliable
-- fix is to never SEND the push to a device whose chat is on screen.
--
-- The chat page heartbeats set_push_presence(session_id, persona, true) every
-- ~20 s while visible, and flips it to false the instant the page is hidden
-- (home screen / app switch / close). The send-push-notification Edge Function
-- skips a subscription whose session is foreground AND fresh (< 45 s).
--
-- Security model mirrors push_subscriptions: RLS on, zero policies, table
-- revoked from anon/authenticated; writes ONLY via a SECURITY DEFINER RPC that
-- validates its arguments. Nothing sensitive is stored (a random session id).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.push_presence (
  session_id  text primary key,
  persona     text not null check (persona in ('faizan','habiba')),
  foreground  boolean not null default false,
  updated_at  timestamptz not null default now()
);

alter table public.push_presence enable row level security;
revoke all on public.push_presence from anon, authenticated;

create or replace function public.set_push_presence(
  p_session_id text,
  p_persona    text,
  p_foreground boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_session_id is null or length(p_session_id) < 4 or length(p_session_id) > 120 then
    raise exception 'invalid session id';
  end if;
  if p_persona not in ('faizan','habiba') then
    raise exception 'invalid persona';
  end if;

  insert into public.push_presence (session_id, persona, foreground, updated_at)
  values (p_session_id, p_persona, coalesce(p_foreground, false), now())
  on conflict (session_id) do update
    set persona    = excluded.persona,
        foreground = excluded.foreground,
        updated_at = now();
end;
$$;

revoke all on function public.set_push_presence(text, text, boolean) from public;
grant execute on function public.set_push_presence(text, text, boolean) to anon, authenticated;

-- Housekeeping: rows are tiny; keep only the last 30 days of devices.
delete from public.push_presence where updated_at < now() - interval '30 days';
