-- Haatma Okil — the firm's actual advocates
--
-- Replaces the placeholder rows seeded in 0002. Matched on the placeholder practice
-- areas rather than deleted and re-inserted, so that if any enquiry has already been
-- assigned to a row it keeps its advocate instead of being orphaned.
--
-- DEVANAGARI SPELLING NEEDS CONFIRMATION. The forms below are the conventional
-- transliterations, but a person's own spelling — as it appears on their citizenship
-- certificate and Bar Council licence — is the authoritative one, and Nepali personal
-- names vary in ways transliteration rules do not capture. In particular "Bishnu" is
-- written both विष्णु (Sanskritic) and बिष्णु (common in Nepali personal names); the
-- second is used here as the more usual spelling for a given name, but confirm it.
--
-- nbc_licence is deliberately left null. The numbers exist on each advocate's licence
-- certificate and belong in this table eventually — when a client later disputes
-- advice, the record of which licensed advocate gave it is what the firm needs — but
-- an absent number blocks nothing and a placeholder would mislead.

update public.advocates
set full_name_ne = 'बिष्णु प्रकाश मणि',
    full_name_en = 'Bishnu Prakash Mani'
where practice_areas @> array['employment']::text[]
  and full_name_en = 'Advocate — name pending';

update public.advocates
set full_name_ne = 'प्रताप रत्न श्रेष्ठ',
    full_name_en = 'Pratap Ratna Shrestha'
where practice_areas @> array['property']::text[]
  and full_name_en = 'Advocate — name pending';

-- Both advocates practise across every area, so routing falls through to caseload.
--
-- assign_advocate already handles this without change: its practice-area preference
-- is true for both, so the ordering drops to the lighter open caseload. Applied AFTER
-- the updates above, which match on the original seeded arrays.
update public.advocates
set practice_areas = array['employment', 'property', 'business', 'family', 'other']
where full_name_en in ('Bishnu Prakash Mani', 'Pratap Ratna Shrestha');
