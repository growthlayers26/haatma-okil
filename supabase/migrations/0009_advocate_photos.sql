-- Mandala Law — advocate portraits
--
-- Stored as a path rather than a blob. Two portraits that change rarely do not
-- justify a storage bucket and its access policies; they are static assets served
-- from public/, and the column just records which file belongs to whom.
--
-- Nullable, and the roster renders the name alone when it is absent — the same rule
-- as the licence number. A broken image placeholder on a professional profile looks
-- worse than no photograph at all.

alter table public.advocates
  add column photo_path text;

update public.advocates
set photo_path = '/advocates/bishnu-prakash-mani.jpg'
where full_name_en = 'Bishnu Prakash Mani';

update public.advocates
set photo_path = '/advocates/pratap-ratna-shrestha.jpg'
where full_name_en = 'Pratap Ratna Shrestha';
