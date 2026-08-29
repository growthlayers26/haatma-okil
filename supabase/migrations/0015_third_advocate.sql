-- Haatma Okil — a third advocate, and Pratap's desk login
--
-- DOMAIN DISCREPANCY, UNRESOLVED. The firm has supplied addresses on two spellings:
--
--   bishnu@haatmaokil.com     (haatma — two a's)
--   prashray@haatmaokil.com   (haatma — two a's)
--   pratap@hatmaokil.com      (hatma  — one a)
--
-- Both are plausible transliterations of हातमा. Each address is recorded exactly as
-- given rather than normalised to a guess, because sign-in is by emailed one-time
-- link: a wrong domain does not error, it simply never matches, and that advocate
-- finds an empty desk with nothing to explain why. Confirm the domain and correct
-- whichever is wrong.

-- ---------------------------------------------------------------- Pratap

update public.advocates
set email = 'pratap@hatmaokil.com'
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
