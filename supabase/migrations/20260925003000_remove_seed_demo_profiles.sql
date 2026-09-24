-- Demo-seed guard. The auth.users delete is
-- 20260925043000_finish_demo_profile_removal.sql.
--
-- A draft of this migration removed rows from storage.objects. Hosted
-- Supabase rejects that (storage.protect_delete, 42501). This version does
-- not touch storage or auth.users. It only installs the profile guard.
--
-- A profile is refused on INSERT when its id is a seed UUID from
-- 20260919163316_seed_maya_chen.sql / 20260919184500_seed_demo_therapists.sql
-- or its email domain is kitchensink.demo. An UPDATE may not move a
-- non-demo email onto that domain.

create or replace function public.reject_demo_seed_email()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  seed_ids uuid[] := array[
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    '33333333-3333-4333-8333-333333333333'::uuid,
    '44444444-4444-4444-8444-444444444444'::uuid,
    '55555555-5555-4555-8555-555555555001'::uuid,
    '55555555-5555-4555-8555-555555555002'::uuid,
    '55555555-5555-4555-8555-555555555003'::uuid,
    '55555555-5555-4555-8555-555555555004'::uuid,
    '55555555-5555-4555-8555-555555555005'::uuid,
    '55555555-5555-4555-8555-555555555006'::uuid,
    '55555555-5555-4555-8555-555555555007'::uuid,
    '55555555-5555-4555-8555-555555555008'::uuid,
    '55555555-5555-4555-8555-555555555009'::uuid,
    '55555555-5555-4555-8555-555555555010'::uuid
  ];
  new_domain text := split_part(lower(btrim(coalesce(new.email, ''))), '@', 2);
  old_domain text;
begin
  -- OLD is unassigned on INSERT; only read it while handling UPDATE.
  if tg_op = 'INSERT' and (new.id = any (seed_ids) or new_domain = 'kitchensink.demo') then
    raise exception 'demo seed profiles are not created on this database'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    old_domain := split_part(lower(btrim(coalesce(old.email, ''))), '@', 2);
    if new_domain = 'kitchensink.demo' and old_domain is distinct from 'kitchensink.demo' then
      raise exception 'cannot change a profile email to the demo seed domain'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

grant execute on function public.reject_demo_seed_email() to anon, authenticated, service_role;

drop trigger if exists profiles_reject_demo_seed_email on public.profiles;
create trigger profiles_reject_demo_seed_email
before insert or update of email on public.profiles
for each row
execute function public.reject_demo_seed_email();
