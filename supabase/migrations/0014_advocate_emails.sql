-- Haatma Okil — advocate desk logins
--
-- Sign-in is by emailed one-time link, so the address IS the credential: whoever
-- controls the mailbox reaches that advocate's queue and the client matters in it.
-- An address attached to the wrong advocate is a confidentiality problem, not a
-- configuration one, which is why only the unambiguous one is set here.

update public.advocates
set email = 'bishnu@haatmaokil.com'
where full_name_en = 'Bishnu Prakash Mani';

-- Pratap Ratna Shrestha's address is deliberately NOT set.
--
-- The firm supplied prashray@haatmaokil.com alongside Bishnu's, but that name does
-- not correspond to the advocate on record, and guessing would hand one advocate a
-- view of the other's privileged matters. Set it once the firm confirms whose it is:
--
--   update public.advocates
--   set email = '<confirmed address>'
--   where full_name_en = 'Pratap Ratna Shrestha';
