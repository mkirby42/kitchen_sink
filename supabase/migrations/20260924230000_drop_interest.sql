-- Interest inbox and the profile "I'm interested" tap are removed.
-- Patient profiles stay; seed reviews still reference them.

drop function if exists public.list_my_interest();
drop function if exists public.interest_alias(uuid);
drop function if exists public.ensure_patient_profile();

drop table if exists public.interest;

drop function if exists public.interest_require_patient_role();
drop function if exists public.interest_require_open_therapist();
