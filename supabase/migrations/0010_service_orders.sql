-- Mandala Law — orders record which service they bought
--
-- orders could say it was for a document (document_id) or a plan (plan_id), but a
-- service order recorded only an amount. Nothing could tell a paid review apart from
-- a paid consultation, which is why contract review had no way to check it had been
-- paid for — and so never checked.

alter table public.orders
  add column service_id text,
  -- Set when the order is spent. Mirrors quota_usage: claim before the work, hand
  -- back if the work fails, so a customer never pays for an analysis that errored.
  add column consumed_at timestamptz;

create index orders_unconsumed_service_idx
  on public.orders (user_id, service_id, status)
  where consumed_at is null;

alter table public.reviews
  add column order_id uuid references public.orders on delete set null;

/*
 * Claim one paid, unspent order for a given service.
 *
 * The FOR UPDATE lock is what stops two reviews fired together from spending the
 * same order — the same failure consume_quota avoids, and the same fix.
 *
 * Returns the order id, or null when the user has nothing paid to spend. Null is not
 * an error: it means the caller must ask for payment before doing the work.
 */
create or replace function public.claim_service_order(p_user uuid, p_service text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_order uuid;
begin
  select id into v_order
  from public.orders
  where user_id = p_user
    and service_id = p_service
    and status = 'paid'
    and consumed_at is null
  order by created_at
  limit 1
  for update skip locked;

  if v_order is null then
    return null;
  end if;

  update public.orders set consumed_at = now() where id = v_order;
  return v_order;
end;
$fn$;

/** Return an order to the unspent pool when the work it paid for did not complete. */
create or replace function public.release_service_order(p_order uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $fn$
  update public.orders set consumed_at = null where id = p_order;
$fn$;
