-- Haatma Okil — organisations, seats and approval
--
-- The subscription stays where migration 0003 put it: on a user. An organisation
-- draws on its owner's subscription rather than holding one of its own. That avoids
-- rewriting the activation path, and it matches how the sale actually happens — a
-- person buys the plan, then brings colleagues onto it.

create type public.org_role as enum ('owner', 'admin', 'member');

create table public.organisations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references auth.users on delete restrict,
  /*
   * Whether documents need an admin's approval before they can be bought.
   *
   * Stored per organisation rather than derived from the plan, because an
   * organisation entitled to the workflow may still choose not to run it. The plan
   * decides whether it CAN be switched on; this decides whether it IS.
   */
  require_approval boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.organisations enable row level security;

create table public.memberships (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organisations on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  role       public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index memberships_user_idx on public.memberships (user_id);
create index memberships_org_idx on public.memberships (org_id, role);

alter table public.memberships enable row level security;

-- ---------------------------------------------------------------- lookups

/*
 * Membership lookups used inside RLS policies.
 *
 * These MUST be security definer. A policy on `memberships` that itself queries
 * `memberships` re-enters the policy and recurses until Postgres gives up; routing
 * the lookup through a definer function reads the table with RLS bypassed and breaks
 * the cycle. Both are read-only and take no arguments a caller could abuse.
 */
create or replace function public.org_role_of(p_org uuid, p_user uuid)
returns public.org_role
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select role from public.memberships where org_id = p_org and user_id = p_user;
$fn$;

create or replace function public.is_org_member(p_org uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select exists (select 1 from public.memberships where org_id = p_org and user_id = p_user);
$fn$;

/** Organisations the user belongs to. Used to scope document visibility. */
create or replace function public.my_org_ids(p_user uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select org_id from public.memberships where user_id = p_user;
$fn$;

-- ---------------------------------------------------------------- policies

create policy "members read their organisation" on public.organisations
  for select using (public.is_org_member(id, auth.uid()));

create policy "owner updates organisation" on public.organisations
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "members read the roster" on public.memberships
  for select using (public.is_org_member(org_id, auth.uid()));

-- Membership is never written from a client session: adding someone consumes a paid
-- seat, so it goes through add_org_member below, running as the service role.

-- ---------------------------------------------------------------- seats

/*
 * Add a member, atomically against the seat limit.
 *
 * The lock on the organisation row is what makes this correct: two invitations
 * accepted at the same moment serialise on it, so the second sees the first's row
 * and is refused at the limit. Counting without the lock lets an organisation
 * overshoot the seats it paid for — the same failure consume_quota avoids in 0003.
 *
 * Seats come from the OWNER's subscription snapshot, so a plan change mid-term does
 * not retroactively evict people.
 */
create or replace function public.add_org_member(
  p_org  uuid,
  p_user uuid,
  p_role public.org_role default 'member'
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_owner uuid;
  v_seats integer;
  v_used  integer;
begin
  select owner_id into v_owner
  from public.organisations
  where id = p_org
  for update;

  if not found then
    return 'no_org';
  end if;

  if exists (select 1 from public.memberships where org_id = p_org and user_id = p_user) then
    return 'already_member';
  end if;

  select seats into v_seats
  from public.subscriptions
  where user_id = v_owner
    and status = 'active'
    and current_period_end > now();

  if v_seats is null then
    return 'no_subscription';
  end if;

  select count(*) into v_used from public.memberships where org_id = p_org;

  if v_used >= v_seats then
    return 'seat_limit';
  end if;

  insert into public.memberships (org_id, user_id, role) values (p_org, p_user, p_role);
  return 'ok';
end;
$fn$;

/** Create an organisation and seat its owner in one transaction. */
create or replace function public.create_organisation(p_owner uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_org uuid;
begin
  insert into public.organisations (name, owner_id) values (p_name, p_owner)
  returning id into v_org;

  -- The owner occupies a seat like anyone else. Excluding them would silently sell
  -- one more seat than the plan says.
  insert into public.memberships (org_id, user_id, role) values (v_org, p_owner, 'owner');

  return v_org;
end;
$fn$;

-- ---------------------------------------------------------------- approval

create type public.approval_status as enum ('not_required', 'pending', 'approved', 'rejected');

alter table public.documents
  add column org_id uuid references public.organisations on delete set null,
  add column approval_status public.approval_status not null default 'not_required',
  add column approved_by uuid references auth.users on delete set null,
  add column approved_at timestamptz,
  add column review_note text;

create index documents_org_approval_idx
  on public.documents (org_id, approval_status)
  where org_id is not null;

-- Admins and owners see every document in their organisation; that is the whole
-- point of an approval queue. Members continue to see only their own, under the
-- policy already created in 0001.
create policy "admins read org documents" on public.documents
  for select using (
    org_id is not null
    and public.org_role_of(org_id, auth.uid()) in ('owner', 'admin')
  );

create policy "admins decide org documents" on public.documents
  for update using (
    org_id is not null
    and public.org_role_of(org_id, auth.uid()) in ('owner', 'admin')
  );

/*
 * Record an approval decision.
 *
 * Refuses to let anyone approve their own draft. Self-approval would make the
 * workflow decorative, and an organisation that switched it on did so precisely to
 * stop one person committing it alone.
 */
create or replace function public.decide_document(
  p_document uuid,
  p_actor    uuid,
  p_approve  boolean,
  p_note     text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_org   uuid;
  v_owner uuid;
  v_role  public.org_role;
begin
  select org_id, user_id into v_org, v_owner
  from public.documents
  where id = p_document
  for update;

  if v_org is null then
    return 'not_org_document';
  end if;

  v_role := public.org_role_of(v_org, p_actor);
  if v_role is null or v_role = 'member' then
    return 'not_permitted';
  end if;

  if v_owner = p_actor then
    return 'self_approval';
  end if;

  update public.documents
  set approval_status = case when p_approve then 'approved' else 'rejected' end,
      approved_by     = p_actor,
      approved_at     = now(),
      review_note     = p_note
  where id = p_document
    and approval_status = 'pending';

  if not found then
    return 'not_pending';
  end if;

  return 'ok';
end;
$fn$;

-- ---------------------------------------------------------------- org templates

/*
 * Organisation templates.
 *
 * Deliberately NOT arbitrary documents. A row here is an OVERLAY on a template that
 * exists in the code registry: it can preset answers and append its own clauses, and
 * it cannot remove or rewrite anything the base template marks locked.
 *
 * That constraint is the reason this table can exist at all. Legal content lives in
 * reviewed code precisely so an amendment is a single audited edit; letting a
 * customer paste arbitrary clause text into the database would reintroduce exactly
 * the drift that design avoids, and the statutory validation in lib/render.ts would
 * have nothing to validate against. An overlay keeps the base — and its locked
 * clauses and its statutory rules — fully intact.
 */
create table public.org_templates (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organisations on delete cascade,
  -- Must correspond to a slug in the code registry. Enforced in the server action,
  -- since this database has no knowledge of lib/templates.
  base_slug      text not null,
  name           text not null,
  -- Values pre-filled for whoever starts from this overlay.
  default_answers jsonb not null default '{}'::jsonb,
  -- Extra clauses appended after the base clauses. Never replace one.
  extra_clauses  jsonb not null default '[]'::jsonb,
  created_by     uuid references auth.users on delete set null,
  created_at     timestamptz not null default now(),
  unique (org_id, name)
);

alter table public.org_templates enable row level security;

create policy "members read org templates" on public.org_templates
  for select using (public.is_org_member(org_id, auth.uid()));

create policy "admins write org templates" on public.org_templates
  for all using (public.org_role_of(org_id, auth.uid()) in ('owner', 'admin'))
  with check (public.org_role_of(org_id, auth.uid()) in ('owner', 'admin'));
