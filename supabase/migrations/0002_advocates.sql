-- Haatma Okil — the advocate desk
--
-- The firm has two practising advocates. This is not a tiered support desk: both
-- layers are licensed counsel, and an enquiry is assigned to one of them rather than
-- escalated between them. Assignment is by practice area with a load-balanced
-- fallback, so neither advocate silently accumulates the whole queue.

-- ---------------------------------------------------------------- advocates

create table public.advocates (
  id              uuid primary key default gen_random_uuid(),
  -- Links to an auth user so an advocate can sign in and work the queue.
  user_id         uuid unique references auth.users on delete set null,
  full_name_ne    text not null,
  full_name_en    text not null,
  -- Nepal Bar Council licence. Seeded as a placeholder; the firm supplies the real
  -- number before the profile is shown to any client.
  nbc_licence     text not null,
  -- Practice areas this advocate takes. Matched against enquiries.area_of_law.
  practice_areas  text[] not null default '{}',
  active          boolean not null default true,
  -- Cap on concurrent open matters, so routing can stop overloading one advocate.
  capacity        integer not null default 20,
  created_at      timestamptz not null default now()
);

alter table public.advocates enable row level security;

-- An advocate's name, licence and practice areas are public-facing: a client is
-- entitled to know who is advising them before they pay.
create policy "advocates are readable" on public.advocates
  for select using (active);

create policy "advocate manages own record" on public.advocates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Two placeholder rows. REPLACE both before launch — these are not real credentials.
insert into public.advocates (full_name_ne, full_name_en, nbc_licence, practice_areas)
values
  ('अधिवक्ता — नाम बाँकी', 'Advocate — name pending', 'PENDING-1',
   array['employment', 'business']),
  ('अधिवक्ता — नाम बाँकी', 'Advocate — name pending', 'PENDING-2',
   array['property', 'family']);

-- ---------------------------------------------------------------- enquiries

-- Rebuilt from 0001: conflict screening is now a recorded outcome rather than just
-- a status, and assignment points at a real advocate.
drop table if exists public.advocate_enquiries;

create type public.enquiry_status as enum (
  'screening',   -- conflict check not yet cleared; no matter detail should be read
  'assigned',
  'answered',
  'declined'     -- refused, usually for conflict
);

create type public.enquiry_kind as enum ('question', 'consultation', 'document_review');

create table public.enquiries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  document_id     uuid references public.documents on delete set null,
  advocate_id     uuid references public.advocates on delete set null,

  kind            public.enquiry_kind not null default 'question',
  area_of_law     text not null,

  -- Collected and cleared BEFORE the matter is described, so a conflicted enquiry is
  -- refused before privileged detail enters the system. `question` stays null until
  -- conflict_cleared_at is set.
  opposing_party  text,
  conflict_cleared_at timestamptz,
  question        text,

  status          public.enquiry_status not null default 'screening',
  answer          text,
  answered_at     timestamptz,
  -- One working day for a written question; consultations are booked separately.
  due_at          timestamptz,

  created_at      timestamptz not null default now()
);

create index enquiries_user_idx on public.enquiries (user_id, created_at desc);
create index enquiries_queue_idx on public.enquiries (advocate_id, status, due_at);

alter table public.enquiries enable row level security;

create policy "client reads own enquiries" on public.enquiries
  for select using (auth.uid() = user_id);

create policy "client creates own enquiries" on public.enquiries
  for insert with check (auth.uid() = user_id);

-- A client may edit only their own enquiry, and only while it is still being screened.
create policy "client edits own unscreened enquiry" on public.enquiries
  for update using (auth.uid() = user_id and status = 'screening')
  with check (auth.uid() = user_id);

-- An advocate sees and works the matters assigned to them.
create policy "advocate reads assigned" on public.enquiries
  for select using (
    exists (
      select 1 from public.advocates a
      where a.id = enquiries.advocate_id and a.user_id = auth.uid()
    )
  );

create policy "advocate answers assigned" on public.enquiries
  for update using (
    exists (
      select 1 from public.advocates a
      where a.id = enquiries.advocate_id and a.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------- routing

/*
 * Pick the advocate for an enquiry: prefer one who lists the practice area, and
 * among those take the lightest open load. Falls back to any active advocate so an
 * unmatched area never leaves an enquiry unassigned.
 *
 * Conflict screening is deliberately NOT done here — it happens before the matter is
 * described, and a conflicted enquiry never reaches assignment.
 */
create or replace function public.assign_advocate(p_area text)
returns uuid language sql stable as $$
  select a.id
  from public.advocates a
  left join public.enquiries e
    on e.advocate_id = a.id and e.status in ('screening', 'assigned')
  where a.active
  group by a.id, a.practice_areas, a.capacity
  having count(e.id) < a.capacity
  order by
    (p_area = any(a.practice_areas)) desc,  -- practice-area match first
    count(e.id) asc,                        -- then lightest load
    a.id
  limit 1;
$$;
