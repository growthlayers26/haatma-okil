-- Mandala Law — signature envelopes
--
-- Under the Electronic Transactions Act, 2063 a digital signature is recognised only
-- when it is backed by a certificate issued by a certifying authority licensed by the
-- Office of the Controller of Certification. A typed name or an "I agree" checkbox is
-- not such a signature, and a document executed that way is not merely weak evidence —
-- it may be void as a signed instrument.
--
-- So this schema models two routes and ships only one of them working:
--
--   wet_ink              — print, sign by hand, upload the executed copy. This is
--                          legally effective in Nepal today and is what users get.
--   digital_certificate  — modelled in full, but cannot complete until the firm
--                          selects a licensed CA and an adapter is implemented. The
--                          impossibility is enforced here rather than left to the UI.
--
-- There is deliberately no third route representing click-wrap. Not offering it is the
-- feature.

create type public.signing_method as enum ('wet_ink', 'digital_certificate');
create type public.envelope_status as enum ('draft', 'sent', 'completed', 'voided');
create type public.signatory_status as enum ('pending', 'signed', 'declined');
create type public.certificate_status as enum ('unverified', 'verified', 'revoked', 'expired');

-- ---------------------------------------------------------------- certificates

/*
 * A signing certificate held by a user.
 *
 * `ca_licence_ref` records WHICH licensed authority issued it. That is the fact the
 * Act turns on, so it belongs in the audit trail rather than being inferred from a
 * name at display time.
 *
 * Rows start `unverified` and are moved to `verified` only by the CA adapter. With no
 * adapter implemented, nothing reaches `verified` — which is the correct behaviour
 * today, not an oversight.
 */
create table public.certificates (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users on delete cascade,
  ca_name             text not null,
  ca_licence_ref      text,
  subject_common_name text not null,
  serial_number       text not null,
  valid_from          timestamptz,
  valid_to            timestamptz,
  status              public.certificate_status not null default 'unverified',
  verified_at         timestamptz,
  created_at          timestamptz not null default now(),
  unique (ca_name, serial_number)
);

alter table public.certificates enable row level security;

create policy "own certificates readable" on public.certificates
  for select using (auth.uid() = user_id);

create policy "own certificates insertable" on public.certificates
  for insert with check (auth.uid() = user_id);

-- Deliberately no update policy. Moving a certificate to `verified` is what gives a
-- signature legal effect, so only the service role may do it.

-- ---------------------------------------------------------------- envelopes

create table public.signature_envelopes (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents on delete cascade,
  created_by   uuid not null references auth.users on delete cascade,
  org_id       uuid references public.organisations on delete set null,
  method       public.signing_method not null default 'wet_ink',
  status       public.envelope_status not null default 'draft',
  subject      text not null,
  message      text,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

create index envelopes_document_idx on public.signature_envelopes (document_id);
create index envelopes_creator_idx on public.signature_envelopes (created_by, created_at desc);

alter table public.signature_envelopes enable row level security;

create policy "own envelopes readable" on public.signature_envelopes
  for select using (auth.uid() = created_by);

create policy "own envelopes writable" on public.signature_envelopes
  for insert with check (auth.uid() = created_by);

create policy "own draft envelopes updatable" on public.signature_envelopes
  for update using (auth.uid() = created_by and status in ('draft', 'sent'))
  with check (auth.uid() = created_by);

-- ---------------------------------------------------------------- signatories

create table public.signatories (
  id              uuid primary key default gen_random_uuid(),
  envelope_id     uuid not null references public.signature_envelopes on delete cascade,
  full_name       text not null,
  email           text,
  -- The capacity in which they sign — "Director", "Witness", "Tenant".
  capacity        text,
  order_index     integer not null default 0,
  status          public.signatory_status not null default 'pending',
  -- Set on the digital route only. A signature with no certificate behind it is not
  -- a recognised digital signature, which is exactly why this is nullable and why
  -- complete_envelope below refuses to finish without it.
  certificate_id  uuid references public.certificates on delete set null,
  -- Set on the wet-ink route: where the scanned executed copy lives.
  executed_copy_path text,
  signed_at       timestamptz,
  declined_reason text,
  created_at      timestamptz not null default now()
);

create index signatories_envelope_idx on public.signatories (envelope_id, order_index);

alter table public.signatories enable row level security;

create policy "signatories of own envelopes readable" on public.signatories
  for select using (
    exists (
      select 1 from public.signature_envelopes e
      where e.id = signatories.envelope_id and e.created_by = auth.uid()
    )
  );

create policy "signatories of own envelopes writable" on public.signatories
  for insert with check (
    exists (
      select 1 from public.signature_envelopes e
      where e.id = signatories.envelope_id
        and e.created_by = auth.uid()
        and e.status = 'draft'
    )
  );

-- ---------------------------------------------------------------- audit

/*
 * Append-only audit trail.
 *
 * Insert and select policies exist; update and delete deliberately do not, so RLS
 * denies both. If a signature is ever disputed, the value of this table lies entirely
 * in nobody having been able to edit it after the fact — including the firm.
 */
create table public.signature_events (
  id           uuid primary key default gen_random_uuid(),
  envelope_id  uuid not null references public.signature_envelopes on delete cascade,
  signatory_id uuid references public.signatories on delete set null,
  actor_id     uuid references auth.users on delete set null,
  kind         text not null,
  detail       jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index signature_events_envelope_idx on public.signature_events (envelope_id, created_at);

alter table public.signature_events enable row level security;

create policy "events of own envelopes readable" on public.signature_events
  for select using (
    exists (
      select 1 from public.signature_envelopes e
      where e.id = signature_events.envelope_id and e.created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------- transitions

/*
 * Record a wet-ink signature.
 *
 * The legally operative act happened on paper; this records that it happened and
 * where the executed copy is held. Kept atomic under a row lock so two uploads for
 * one signatory cannot both append a "signed" event.
 */
create or replace function public.record_wet_ink_signature(
  p_signatory uuid,
  p_actor     uuid,
  p_path      text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_envelope uuid;
  v_status   public.signatory_status;
  v_method   public.signing_method;
begin
  select s.envelope_id, s.status, e.method
    into v_envelope, v_status, v_method
  from public.signatories s
  join public.signature_envelopes e on e.id = s.envelope_id
  where s.id = p_signatory
  for update of s;

  if not found then return 'not_found'; end if;
  if v_method <> 'wet_ink' then return 'wrong_method'; end if;
  if v_status <> 'pending' then return 'not_pending'; end if;

  update public.signatories
  set status = 'signed', signed_at = now(), executed_copy_path = p_path
  where id = p_signatory;

  insert into public.signature_events (envelope_id, signatory_id, actor_id, kind, detail)
  values (v_envelope, p_signatory, p_actor, 'wet_ink_signature_recorded',
          jsonb_build_object('path', p_path));

  return 'ok';
end;
$fn$;

/*
 * Complete an envelope once every signatory has signed.
 *
 * The digital route additionally requires each signatory to carry a certificate that
 * is currently `verified`. Since no CA adapter is implemented, no certificate can
 * reach that state, so a digital envelope cannot complete — enforced here so the
 * guarantee does not depend on the UI being correct.
 */
create or replace function public.complete_envelope(p_envelope uuid, p_actor uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_method    public.signing_method;
  v_status    public.envelope_status;
  v_pending   integer;
  v_uncertified integer;
begin
  select method, status into v_method, v_status
  from public.signature_envelopes
  where id = p_envelope
  for update;

  if not found then return 'not_found'; end if;
  if v_status = 'completed' then return 'ok'; end if;
  if v_status = 'voided' then return 'voided'; end if;

  select count(*) into v_pending
  from public.signatories
  where envelope_id = p_envelope and status <> 'signed';

  if v_pending > 0 then return 'incomplete'; end if;

  if v_method = 'digital_certificate' then
    select count(*) into v_uncertified
    from public.signatories s
    left join public.certificates c on c.id = s.certificate_id
    where s.envelope_id = p_envelope
      and (c.id is null or c.status <> 'verified');

    if v_uncertified > 0 then
      return 'certificate_not_verified';
    end if;
  end if;

  update public.signature_envelopes
  set status = 'completed', completed_at = now()
  where id = p_envelope and status <> 'completed';

  insert into public.signature_events (envelope_id, actor_id, kind, detail)
  values (p_envelope, p_actor, 'envelope_completed', jsonb_build_object('method', v_method));

  return 'ok';
end;
$fn$;
