-- Mandala Law — notifications
--
-- An enquiry landed silently in a table. Even with the advocate desk built, both
-- advocates would have to think to open it to discover that paid work had arrived,
-- and a client had no way to learn their answer was ready.
--
-- Messages are RECORDED here first and dispatched second. That ordering is the point:
-- with no provider connected yet, nothing is lost — the queue simply fills, and
-- everything in it goes out when a sender is configured. A fire-and-forget call to a
-- provider that does not exist would drop the message silently.

create type public.notification_channel as enum ('email', 'sms');
create type public.notification_status as enum ('queued', 'sent', 'failed');

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  -- Null for a recipient who has no account — an advocate is a user, a signatory
  -- invited by email may not be.
  user_id      uuid references auth.users on delete cascade,
  channel      public.notification_channel not null default 'email',
  recipient    text not null,

  -- What happened, in a form that can be filtered and counted later.
  kind         text not null,
  subject      text not null,
  body         text not null,

  -- What it was about, so a message can be traced back to its cause.
  enquiry_id   uuid references public.enquiries on delete set null,
  order_id     uuid references public.orders on delete set null,
  document_id  uuid references public.documents on delete set null,

  status       public.notification_status not null default 'queued',
  sent_at      timestamptz,
  error        text,
  attempts     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index notifications_queue_idx
  on public.notifications (status, created_at)
  where status = 'queued';

create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Readable by its recipient. Deliberately not writable by anyone through a session:
-- queueing is a server-side consequence of something happening, never a client action.
create policy "own notifications readable" on public.notifications
  for select using (auth.uid() = user_id);
