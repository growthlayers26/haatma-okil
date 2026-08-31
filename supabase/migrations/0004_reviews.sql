-- Haatma Okil — contract review
--
-- Stores what the review concluded, deliberately NOT the document it read.
--
-- A pasted contract is the most sensitive thing a user hands this product: it may be
-- privileged, it names third parties who never consented to be here, and it is of no
-- further use once the facts are extracted. Keeping it would create a breach target
-- and a disclosure obligation in exchange for nothing. So the raw text is held in
-- memory for the length of one request and never written down.

create type public.review_severity as enum ('breach', 'missing', 'check');

create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,

  -- Classification and extracted observations. No document text.
  document_type  text not null,
  facts          jsonb not null default '{}'::jsonb,
  findings       jsonb not null default '[]'::jsonb,

  -- Denormalised counts so the dashboard need not parse the findings array.
  breach_count   integer not null default 0,
  missing_count  integer not null default 0,
  check_count    integer not null default 0,

  -- Whether the subscriber's monthly allowance covered this review.
  covered_by_plan boolean not null default false,

  -- Set when the user escalates the review into a matter with an advocate. This is
  -- the point of the whole feature: findings are questions, and an advocate answers.
  enquiry_id     uuid references public.enquiries on delete set null,

  created_at     timestamptz not null default now()
);

create index reviews_user_idx on public.reviews (user_id, created_at desc);

alter table public.reviews enable row level security;

create policy "own reviews readable" on public.reviews
  for select using (auth.uid() = user_id);

create policy "own reviews insertable" on public.reviews
  for insert with check (auth.uid() = user_id);

create policy "own reviews updatable" on public.reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
