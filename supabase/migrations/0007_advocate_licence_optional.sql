-- Haatma Okil — the Bar Council licence becomes optional to store
--
-- Every practising advocate in Nepal holds a licence from the Bar Council, so this
-- is not a claim that the number does not exist. It is a recognition that the firm
-- may not have it to hand when the profile is first set up, and that a placeholder
-- shown to a client is worse than an absence: "NBC licence no. PENDING" on a public
-- profile reads either as a broken page or as an advocate who is not licensed.
--
-- The number is regulatory record-keeping rather than client-facing marketing. Most
-- firms list advocates by name and practice area alone, so omitting it until it is
-- supplied costs nothing and misleads nobody.

alter table public.advocates
  alter column nbc_licence drop not null;

-- Clear the placeholders seeded in 0002 so nothing renders the string "PENDING".
update public.advocates
set nbc_licence = null
where nbc_licence in ('PENDING-1', 'PENDING-2', 'PENDING');
