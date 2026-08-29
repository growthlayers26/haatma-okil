-- Mandala Law — let a signatory see what they are signing
--
-- Every policy on signature_envelopes scoped to created_by, so only the person who
-- opened the envelope could see it. The people actually named on it — the ones being
-- asked to put their name to a deed — had no access to the envelope or the document.
--
-- Signatories are matched by email rather than by account, because a counterparty is
-- often not a user of this product and should not have to become one to read what
-- they are being asked to sign. Sign-in is by emailed one-time link, so a session
-- proves control of the address.

/*
 * Security definer for the same reason the organisation helpers are: a policy on
 * signatories that queries signatories re-enters itself and recurses.
 */
create or replace function public.is_envelope_signatory(p_envelope uuid, p_email text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select exists (
    select 1 from public.signatories
    where envelope_id = p_envelope
      and email is not null
      and lower(email) = lower(p_email)
  );
$fn$;

/** Envelopes the caller is named on, by verified email. */
create or replace function public.my_signing_envelopes(p_email text)
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select distinct envelope_id
  from public.signatories
  where email is not null
    and lower(email) = lower(p_email);
$fn$;

create policy "signatory reads their envelope" on public.signature_envelopes
  for select using (
    public.is_envelope_signatory(id, auth.jwt() ->> 'email')
  );

create policy "signatory reads the roster" on public.signatories
  for select using (
    public.is_envelope_signatory(envelope_id, auth.jwt() ->> 'email')
  );

/*
 * And the document itself — an envelope without the instrument is a request to sign
 * something unseen, which is the one thing a signing flow must never ask for.
 */
create policy "signatory reads the document" on public.documents
  for select using (
    exists (
      select 1
      from public.signature_envelopes e
      where e.document_id = documents.id
        and public.is_envelope_signatory(e.id, auth.jwt() ->> 'email')
    )
  );

/*
 * A signatory records their own wet-ink signature.
 *
 * Restricted to their own row and only while it is pending — nobody signs on someone
 * else's behalf, and nobody re-signs a matter already recorded.
 */
create policy "signatory records own signature" on public.signatories
  for update using (
    email is not null
    and lower(email) = lower(auth.jwt() ->> 'email')
    and status = 'pending'
  )
  with check (
    email is not null
    and lower(email) = lower(auth.jwt() ->> 'email')
  );
