-- Signed-in therapist deletes their own profile.
-- Auth user stays so they can join again. Patients, admins, and other
-- therapists are not deleted.
-- Child rows cascade from profiles / therapists (rates, licenses,
-- qualifications, tags, cards, location, feedback, reviews about them).
-- reviews_delete_own only lets the author delete their row. This function
-- is security definer so that policy does not block the cascade. Patient
-- profiles stay.
-- Storage objects are not deleted here. Hosted Storage rejects SQL deletes
-- (storage.protect_delete). The app removes photos/{uid}/ and videos/{uid}/
-- with the Storage API after this function succeeds.
-- No profiles DELETE policy: a table delete cannot skip the typed confirm.

create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.delete_own_therapist_profile(p_confirm text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := (select auth.uid());
  v_role text;
begin
  if v_id is null then
    raise exception 'Authentication is required to delete a therapist profile'
      using errcode = '42501';
  end if;

  if p_confirm is distinct from 'DELETE' then
    raise exception 'Type DELETE to confirm'
      using errcode = '22023';
  end if;

  select p.role
  into v_role
  from public.profiles p
  where p.id = v_id
  for update;

  if v_role is distinct from 'therapist' then
    raise exception 'No therapist profile to delete'
      using errcode = '42501';
  end if;

  delete from public.profiles
  where id = v_id
    and role = 'therapist';
end;
$$;

revoke all on function private.delete_own_therapist_profile(text)
  from public, anon, authenticated, service_role;
grant execute on function private.delete_own_therapist_profile(text)
  to authenticated;

create or replace function public.delete_own_therapist_profile(p_confirm text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.delete_own_therapist_profile(p_confirm);
end;
$$;

revoke all on function public.delete_own_therapist_profile(text)
  from public, anon, authenticated, service_role;
grant execute on function public.delete_own_therapist_profile(text)
  to authenticated;

comment on function public.delete_own_therapist_profile(text) is
  'Deletes the signed-in therapist profile after p_confirm is DELETE. Cascades therapist-owned rows. Does not delete auth.users or any other profile.';
