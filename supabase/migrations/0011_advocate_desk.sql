-- Haatma Okil — linking an advocate to their login, and answering
--
-- 0002 gave advocates a user_id and RLS policies letting them read and update the
-- matters assigned to them. Nothing ever set user_id, so those policies matched
-- nobody: enquiries accumulated in a table neither advocate could open.

alter table public.advocates
  -- The firm email each advocate signs in with. Left null here because inventing an
  -- address would link a real person's queue to an account nobody controls; the firm
  -- sets these before the desk is usable.
  add column email text unique;

/*
 * Link the signed-in user to their advocate record.
 *
 * Matching on email is safe because sign-in is by emailed one-time link, so the
 * session proves control of the address. It links only when the advocate row has no
 * user_id yet — an already-linked record is never reassigned by someone who happens
 * to acquire the address later.
 */
create or replace function public.link_advocate_account(p_user uuid, p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_id uuid;
begin
  -- Already linked to this user: nothing to do.
  select id into v_id from public.advocates where user_id = p_user;
  if v_id is not null then
    return v_id;
  end if;

  update public.advocates
  set user_id = p_user
  where lower(email) = lower(p_email)
    and user_id is null
  returning id into v_id;

  return v_id;
end;
$fn$;

/*
 * Answer a matter.
 *
 * Refuses anything not assigned to the caller, and anything not in 'assigned' — an
 * enquiry still in 'screening' has no question attached yet, so there is nothing to
 * answer. Locked so two advocates cannot both answer the same matter.
 */
create or replace function public.answer_enquiry(
  p_enquiry uuid,
  p_actor   uuid,
  p_answer  text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_advocate uuid;
  v_assigned uuid;
  v_status   public.enquiry_status;
begin
  select id into v_advocate from public.advocates where user_id = p_actor;
  if v_advocate is null then
    return 'not_an_advocate';
  end if;

  select advocate_id, status into v_assigned, v_status
  from public.enquiries
  where id = p_enquiry
  for update;

  if not found then return 'not_found'; end if;
  if v_assigned is distinct from v_advocate then return 'not_assigned_to_you'; end if;
  if v_status <> 'assigned' then return 'not_answerable'; end if;

  update public.enquiries
  set answer = p_answer, status = 'answered', answered_at = now()
  where id = p_enquiry;

  return 'ok';
end;
$fn$;
