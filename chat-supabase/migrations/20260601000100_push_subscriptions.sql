-- ============================================================================
-- 20260601000100_push_subscriptions.sql
--
-- Web Push (VAPID) — subscription storage for the NEW Supabase project.
--
-- SECURITY MODEL (no Supabase Auth exists in this app; the browser only ever
-- holds the public anon key):
--   • The table is WRITE-ONLY from the browser's point of view. anon has NO
--     table privileges at all — it cannot SELECT anyone's endpoints.
--   • Writes go exclusively through two SECURITY DEFINER functions with a
--     pinned search_path and validated arguments.
--   • Only the service-role Edge Function ever reads the table.
--
-- SAFE TO RE-RUN. Touches nothing belonging to chat_messages.
-- ============================================================================

-- ── 1) Table ──────────────────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  endpoint   text primary key,             -- the push service URL (unique per device)
  persona    text not null check (persona in ('faizan','habiba')),
  session_id text not null,                -- so we never notify the sender's own device
  p256dh     text not null,                -- payload encryption key (RFC 8291)
  auth       text not null,                -- payload auth secret
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_persona_idx
  on public.push_subscriptions (persona);

-- ── 2) Lock it down ────────────────────────────────────────────────────
alter table public.push_subscriptions enable row level security;
-- No policies on purpose: with RLS on and zero policies, anon/authenticated get
-- nothing. The service role bypasses RLS, which is exactly what we want.
revoke all on public.push_subscriptions from anon, authenticated;

-- ── 3) Register / refresh a subscription ─────────────────────────────────
-- Upsert on endpoint: re-enabling 🔔 on the same device updates instead of
-- creating duplicates (which would deliver the same banner twice).
create or replace function public.save_push_subscription(
  p_persona    text,
  p_session_id text,
  p_endpoint   text,
  p_p256dh     text,
  p_auth       text,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_persona not in ('faizan','habiba') then
    raise exception 'invalid persona';
  end if;
  if p_endpoint is null or length(p_endpoint) < 20 then
    raise exception 'invalid endpoint';
  end if;
  if p_p256dh is null or p_auth is null then
    raise exception 'missing encryption keys';
  end if;
  if p_session_id is null or length(p_session_id) < 1 then
    raise exception 'invalid session';
  end if;

  insert into public.push_subscriptions
    (endpoint, persona, session_id, p256dh, auth, user_agent)
  values
    (p_endpoint, p_persona, p_session_id, p_p256dh, p_auth, p_user_agent)
  on conflict (endpoint) do update
    set persona    = excluded.persona,
        session_id = excluded.session_id,
        p256dh     = excluded.p256dh,
        auth       = excluded.auth,
        user_agent = excluded.user_agent,
        updated_at = now();
end $$;

-- ── 4) Unregister ─────────────────────────────────────────────────────
create or replace function public.delete_push_subscription(p_endpoint text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;

-- ── 5) Grants: EXECUTE only, nothing else ────────────────────────────────
revoke all on function public.save_push_subscription(text,text,text,text,text,text) from public;
revoke all on function public.delete_push_subscription(text) from public;

grant execute on function public.save_push_subscription(text,text,text,text,text,text)
  to anon, authenticated;
grant execute on function public.delete_push_subscription(text)
  to anon, authenticated;

-- ── 6) Verify ───────────────────────────────────────────────────────
-- select persona, count(*), max(updated_at)
--   from public.push_subscriptions group by persona;
