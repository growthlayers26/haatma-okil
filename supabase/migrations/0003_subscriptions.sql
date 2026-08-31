-- Haatma Okil — subscriptions and metered entitlements
--
-- The plan catalogue itself lives in lib/plans.ts, not here. What this schema stores
-- is which plan a user holds and what they have consumed — the same split as the
-- templates: definitions in reviewed code, facts about users in the database.

-- ---------------------------------------------------------------- subscriptions

create type public.plan_id as enum ('free', 'business', 'enterprise');
create type public.billing_period as enum ('monthly', 'annual');
create type public.subscription_status as enum ('active', 'expired', 'cancelled');
create type public.quota_kind as enum ('question', 'review');

create table public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  -- One subscription per user. A renewal extends this row rather than adding one.
  user_id               uuid unique not null references auth.users on delete cascade,
  plan_id               public.plan_id not null,
  billing_period        public.billing_period not null,
  status                public.subscription_status not null default 'active',

  /*
   * Entitlement snapshot, taken from lib/plans.ts at activation.
   *
   * Deliberately copied rather than looked up. If the firm later changes what a
   * Business plan includes, existing subscribers keep what they actually bought
   * until their next renewal — changing it under them would be a straightforward
   * breach of the deal they paid for.
   */
  questions_per_month   integer not null default 0 check (questions_per_month >= 0),
  reviews_per_month     integer not null default 0 check (reviews_per_month >= 0),
  seats                 integer not null default 1 check (seats >= 1),

  current_period_start  timestamptz not null default now(),
  current_period_end    timestamptz not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index subscriptions_active_idx
  on public.subscriptions (user_id, status, current_period_end);

alter table public.subscriptions enable row level security;

-- Readable by its owner. Deliberately NOT writable by them: a subscription is
-- created only by the payment verification path, which runs as the service role.
create policy "own subscription readable" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------- quota usage

/*
 * One row per consumed unit, rather than a counter decremented in place.
 *
 * A counter tells you what is left; these rows tell you what was taken and when,
 * which is what you need when a subscriber disputes their usage. It also makes the
 * consumption check a COUNT under a row lock, which is straightforward to reason
 * about — see consume_quota below.
 */
create table public.quota_usage (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions on delete cascade,
  user_id         uuid not null references auth.users on delete cascade,
  kind            public.quota_kind not null,
  enquiry_id      uuid references public.enquiries on delete set null,
  -- The calendar month this consumption counted against.
  period_start    timestamptz not null,
  consumed_at     timestamptz not null default now()
);

create index quota_usage_window_idx
  on public.quota_usage (subscription_id, kind, period_start);

alter table public.quota_usage enable row level security;

create policy "own usage readable" on public.quota_usage
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------- orders

-- Orders can now buy a plan as well as a document.
alter table public.orders
  add column plan_id public.plan_id,
  add column billing_period public.billing_period;

-- ---------------------------------------------------------------- consumption

/*
 * Consume one unit of quota, atomically.
 *
 * The FOR UPDATE lock on the subscription row is what makes this safe: two requests
 * arriving together serialise on it, so the second sees the first's insert and is
 * correctly refused at the limit. Counting without the lock would let both pass.
 *
 * Returns the id of the usage row it created, or null if there is no active
 * subscription, the plan includes none of this kind, or the month's allowance is
 * exhausted. A null is not an error — it means the matter is billed per-use instead.
 *
 * Returning the id rather than a boolean is what lets the caller link the unit to the
 * matter it paid for, and hand it back if opening that matter then fails.
 */
create or replace function public.consume_quota(p_user uuid, p_kind public.quota_kind)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_sub          public.subscriptions%rowtype;
  v_limit        integer;
  v_used         integer;
  v_window_start timestamptz;
  v_usage_id     uuid;
begin
  select * into v_sub
  from public.subscriptions
  where user_id = p_user
    and status = 'active'
    and current_period_end > now()
  for update;

  if not found then
    return null;
  end if;

  v_limit := case p_kind
               when 'question' then v_sub.questions_per_month
               when 'review'   then v_sub.reviews_per_month
             end;

  if coalesce(v_limit, 0) <= 0 then
    return null;
  end if;

  -- Anchored to the calendar month rather than the billing anniversary: "five
  -- questions a month" should mean what a subscriber assumes it means.
  v_window_start := date_trunc('month', now());

  select count(*) into v_used
  from public.quota_usage
  where subscription_id = v_sub.id
    and kind = p_kind
    and period_start = v_window_start;

  if v_used >= v_limit then
    return null;
  end if;

  insert into public.quota_usage (subscription_id, user_id, kind, period_start)
  values (v_sub.id, p_user, p_kind, v_window_start)
  returning id into v_usage_id;

  return v_usage_id;
end;
$fn$;

/*
 * Remaining allowance for the current month, without consuming any.
 *
 * Read-only, so it takes no lock — a number shown in the UI may be one request
 * stale, which is harmless. Only consume_quota gates anything.
 */
create or replace function public.quota_remaining(p_user uuid, p_kind public.quota_kind)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select greatest(
    0,
    coalesce(
      (case p_kind
         when 'question' then s.questions_per_month
         when 'review'   then s.reviews_per_month
       end)
      - (select count(*)
         from public.quota_usage u
         where u.subscription_id = s.id
           and u.kind = p_kind
           and u.period_start = date_trunc('month', now())),
      0
    )
  )::integer
  from public.subscriptions s
  where s.user_id = p_user
    and s.status = 'active'
    and s.current_period_end > now();
$fn$;

/*
 * Activate or renew a subscription. Called only from the payment verification path.
 *
 * A renewal extends from the later of now and the existing period end, so renewing
 * early does not forfeit the remaining days already paid for.
 */
create or replace function public.activate_subscription(
  p_user       uuid,
  p_plan       public.plan_id,
  p_period     public.billing_period,
  p_questions  integer,
  p_reviews    integer,
  p_seats      integer
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_from timestamptz;
  v_end  timestamptz;
  v_id   uuid;
begin
  select greatest(now(), coalesce(current_period_end, now()))
    into v_from
  from public.subscriptions
  where user_id = p_user;

  v_from := coalesce(v_from, now());
  v_end  := case p_period
              when 'annual'  then v_from + interval '1 year'
              when 'monthly' then v_from + interval '1 month'
            end;

  insert into public.subscriptions as s (
    user_id, plan_id, billing_period, status,
    questions_per_month, reviews_per_month, seats,
    current_period_start, current_period_end, updated_at
  )
  values (
    p_user, p_plan, p_period, 'active',
    p_questions, p_reviews, p_seats,
    now(), v_end, now()
  )
  on conflict (user_id) do update set
    plan_id              = excluded.plan_id,
    billing_period       = excluded.billing_period,
    status               = 'active',
    questions_per_month  = excluded.questions_per_month,
    reviews_per_month    = excluded.reviews_per_month,
    seats                = excluded.seats,
    current_period_start = now(),
    current_period_end   = excluded.current_period_end,
    updated_at           = now()
  returning s.id into v_id;

  return v_id;
end;
$fn$;

-- ---------------------------------------------------------------- enquiries

/*
 * Whether this matter was covered by the subscriber's monthly allowance or billed
 * per matter. Recorded on the enquiry rather than inferred later, because the
 * allowance is consumed at intake and the answer must not change retroactively when
 * a subscription lapses or renews.
 */
alter table public.enquiries
  add column covered_by_plan boolean not null default false;

/*
 * Hand a consumed unit back.
 *
 * Called when the matter the unit was taken for could not be opened. Deleting the
 * usage row restores the allowance, because the allowance is computed by counting
 * rows rather than by decrementing a stored counter — which is precisely why it was
 * modelled that way.
 */
create or replace function public.release_quota(p_usage_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $fn$
  delete from public.quota_usage where id = p_usage_id;
$fn$;
