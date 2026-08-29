-- Haatma Okil — a third advocate, and Pratap's desk login
--
-- The domain is haatmaokil.com — हातमा, two a's — confirmed by the firm. One address
-- had arrived as hatmaokil.com and has been corrected here.
--
-- Worth recording why that mattered: sign-in is by emailed one-time link, so a wrong
-- domain does not error. It simply never matches, and the advocate opens an empty
-- desk with nothing on screen to explain why.

-- ---------------------------------------------------------------- Pratap

update public.advocates
set email = 'pratap@haatmaokil.com'
where full_name_en = 'Pratap Ratna Shrestha';

-- ---------------------------------------------------------------- Prashray

/*
 * A third practising advocate.
 *
 * Practice areas match the other two — all of them — so assign_advocate continues to
 * route purely on caseload. It needs no change to handle a third: the ordering has
 * always been a query over active advocates rather than a two-way branch.
 *
 * DEVANAGARI SPELLING NEEDS CONFIRMATION, as it did for the others. The advocate's
 * own spelling, on their citizenship certificate and Bar Council licence, is the
 * authoritative one.
 *
 * nbc_licence stays null. It exists on their licence certificate and belongs here
 * eventually, but an absent number blocks nothing and a placeholder would mislead.
 */
insert into public.advocates
  (full_name_ne, full_name_en, email, practice_areas, active)
values
  (
    'प्रश्रय दाहाल',
    'Prashray Dahal',
    'prashray@haatmaokil.com',
    array['employment', 'property', 'business', 'family', 'other'],
    true
  )
on conflict (email) do nothing;
