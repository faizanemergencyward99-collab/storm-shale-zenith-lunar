-- ============================================================================
-- 20260601000200_push_delivery_webhook.sql
--
-- RELIABLE push delivery + exactly-once guarantee.
--
-- There are TWO senders:
--   A. CLIENT path  — the sender's browser calls the Edge Function right after
--      it inserts the message (instant, but lost if they close the app at once).
--   B. SERVER path  — this AFTER INSERT trigger POSTs the new row to the same
--      Edge Function via pg_net (fires even if the sender's app is gone).
--
-- Both may run. `push_dispatch` is an idempotency ledger keyed on message_id,
-- so whichever request arrives first wins and the loser becomes a no-op.
-- Result: exactly ONE notification per message.
--
-- NOTE: message_id is TEXT, not uuid — the wake-up feature deliberately sends
-- synthetic ids like 'wakeup-missed-<uuid>' through the same function.
--
-- PREREQUISITE: run 20260601000100_push_subscriptions.sql first, and deploy the
-- Edge Function BEFORE creating the trigger (otherwise pg_net POSTs to a 404 —
-- harmless, but pointless).
--
-- SAFE TO RE-RUN.
-- ============================================================================

-- ── 1) Extensions ─────────────────────────────────────────────────────
create extension if not exists pg_net      with schema extensions;
create extension if not exists supabase_vault;

-- ── 2) Idempotency ledger ────────────────────────────────────────────
create table if not exists public.push_dispatch (
  message_id   text primary key,
  claimed_at   timestamptz not null default now(),
  completed_at timestamptz,
  result       jsonb,
  last_error   text
);

alter table public.push_dispatch enable row level security;
revoke all on public.push_dispatch from anon, authenticated;

-- ── 3) Project URL in Vault (nothing secret to paste) ─────────────────────
-- pg_net only needs to know WHERE to POST.
--
-- OPTIONAL HARDENING: the Edge Function also accepts an `x-push-internal-key`
-- header to tell trigger calls apart from browser calls. It is informational
-- only (the browser has no JWT and cannot send one either), so it is NOT
-- required. If you ever want it, add a Vault secret named 'push_internal_key'
-- matching the PUSH_INTERNAL_KEY function secret and the trigger below starts
-- sending it automatically.
--
-- Re-running replaces the value instead of erroring.
do $$
declare
  v_project_url text := 'https://jqhstwtmhtsupkiwatyv.supabase.co';
  v_id          uuid;
begin
  select id into v_id from vault.secrets where name = 'project_url';
  if v_id is null then
    perform vault.create_secret(v_project_url, 'project_url');
  else
    perform vault.update_secret(v_id, v_project_url, 'project_url');
  end if;
end $$;

-- ── 4) Trigger function ───────────────────────────────────────────────
-- chat_messages has NO recipient column — there are exactly two people, so the
-- recipient is simply "the other persona".
-- pg_net is ASYNCHRONOUS: the insert is never blocked waiting on delivery.
-- The whole body is wrapped in an exception guard so a push problem can NEVER
-- stop a chat message from being saved.
create or replace function public.notify_push_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url      text;
  v_key      text;
  v_recipient text;
begin
  begin
    select decrypted_secret into v_url
      from vault.decrypted_secrets where name = 'project_url';
    select decrypted_secret into v_key
      from vault.decrypted_secrets where name = 'push_internal_key';

    if v_url is null then
      return new; -- not configured yet; stay silent
    end if;

    v_recipient := case when new.sender = 'faizan' then 'habiba' else 'faizan' end;

    perform net.http_post(
      url     := v_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'x-push-internal-key', coalesce(v_key, '')
                 ),
      body    := jsonb_build_object(
                   'message_id',         new.id::text,
                   'sender',             new.sender,
                   'recipient',          v_recipient,
                   'text',               new.text,
                   'type',               coalesce(new.type, 'text'),
                   'url',                '/',
                   'exclude_session_id', new.session_id
                 ),
      timeout_milliseconds := 5000
    );
  exception when others then
    -- Swallow everything. A failed push must never break the chat.
    raise warning 'notify_push_on_message failed: %', sqlerrm;
  end;
  return new;
end $$;

drop trigger if exists chat_messages_push_after_insert on public.chat_messages;
create trigger chat_messages_push_after_insert
  after insert on public.chat_messages
  for each row execute function public.notify_push_on_message();

-- ── 5) Verify ───────────────────────────────────────────────────────
-- Recent outbound pg_net calls (status_code should be 200):
--   select id, status_code, content::text
--     from net._http_response order by created desc limit 5;
-- Recent dispatch ledger rows:
--   select * from public.push_dispatch order by claimed_at desc limit 10;
