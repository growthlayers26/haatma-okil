-- Mandala Law — initial schema
--
-- Design note: clause text lives in version-controlled code, never in this database.
-- What is stored here is what a user answered and what they paid. That keeps legal
-- content under review and in git, and keeps this schema free of legal drift.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  full_name     text,
  phone         text,
  preferred_lang text not null default 'ne' check (preferred_lang in ('ne', 'en')),
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------- documents

create type public.document_status as enum ('draft', 'purchased');

create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  template_slug text not null,
  -- Pin the template version the answers were given against, so a later amendment
  -- can be detected rather than silently changing what the user already bought.
  template_version text not null default 'v1',
  answers       jsonb not null default '{}'::jsonb,
  status        public.document_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index documents_user_idx on public.documents (user_id, updated_at desc);
-- Drives the amendment alert: "which users hold a document from this template".
create index documents_template_idx on public.documents (template_slug, template_version);

alter table public.documents enable row level security;

create policy "own documents" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------- orders

create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.payment_gateway as enum ('khalti', 'esewa', 'fonepay', 'card');

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  document_id       uuid references public.documents on delete set null,
  gateway           public.payment_gateway not null,
  -- Integer paisa avoids floating-point drift on money.
  amount_paisa      bigint not null check (amount_paisa > 0),
  status            public.order_status not null default 'pending',
  gateway_reference text,
  -- Set only by the server-side verification path, never from a gateway redirect.
  verified_at       timestamptz,
  created_at        timestamptz not null default now()
);

-- One order per gateway reference: gateways retry, and verification must be idempotent.
create unique index orders_gateway_reference_idx
  on public.orders (gateway, gateway_reference)
  where gateway_reference is not null;

alter table public.orders enable row level security;

-- Read-only to the owner. Orders are written by the service role from the verification
-- endpoint, so no client can ever transition an order to 'paid'.
create policy "read own orders" on public.orders
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------- advocate enquiries

create type public.enquiry_status as enum ('screening', 'assigned', 'answered', 'declined');

create table public.advocate_enquiries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  document_id    uuid references public.documents on delete set null,
  -- Collected before the matter is described, so a conflicted enquiry is refused
  -- before privileged detail enters the system.
  opposing_party text,
  area_of_law    text,
  question       text,
  status         public.enquiry_status not null default 'screening',
  assigned_advocate text,
  created_at     timestamptz not null default now()
);

alter table public.advocate_enquiries enable row level security;

create policy "own enquiries" on public.advocate_enquiries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------- triggers

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_touch
  before update on public.documents
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
