-- An admin already has the one profiles row (role stays admin, even with a
-- test therapist profile). ensure_patient_profile used to INSERT a patient
-- row for every non-patient, which hit profiles_pkey. reviews_guard then
-- rejected the insert because role was not patient. The form mapped that
-- unique violation to "Couldn't post that review."
--
-- An admin may post one review on someone else's open profile. patient_id
-- is their existing profile id. Role is not changed. They still cannot
-- review their own profile. A therapist account still cannot review.
-- One row per reviewer + therapist stays reviews_one_per_patient.
-- The directory listing migration requires open_to_new_clients and listed
-- for a public profile. reviews_guard is security invoker, and an admin can
-- select unlisted therapist rows, so the guard checks listed itself.

create or replace function public.ensure_patient_profile()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := (select auth.uid());
  v_role text;
begin
  if v_id is null then
    raise exception 'Sign in as a client to leave a review.'
      using errcode = '42501';
  end if;

  select p.role into v_role
  from public.profiles p
  where p.id = v_id;

  if v_role = 'therapist' then
    raise exception 'Sign in as a client to leave a review.'
      using errcode = '42501';
  end if;

  if v_role in ('patient', 'admin') then
    return v_id;
  end if;

  insert into public.profiles (id, role, name, email)
  values (
    v_id,
    'patient',
    'Patient',
    (select auth.jwt() ->> 'email')
  );

  return v_id;
end;
$$;

revoke all on function public.ensure_patient_profile() from public, anon;
grant execute on function public.ensure_patient_profile() to authenticated;

create or replace function public.reviews_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.therapist_id := old.therapist_id;
    new.created_at := old.created_at;
    -- A signed-in user cannot reassign the review. auth.uid() is null when
    -- ON DELETE SET NULL clears patient_id, so account deletion still works.
    if (select auth.uid()) is not null then
      new.patient_id := old.patient_id;
    end if;
  elsif (select auth.uid()) is not null then
    new.patient_id := (select auth.uid());
    new.created_at := now();
  end if;

  if new.patient_id is null then
    if tg_op = 'UPDATE' and (select auth.uid()) is null then
      return new;
    end if;
    raise exception 'Sign in as a client to leave a review.';
  end if;

  if new.patient_id = new.therapist_id then
    raise exception 'You cannot review your own profile.';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = new.patient_id
      and p.role in ('patient', 'admin')
  ) then
    raise exception 'Sign in as a client to leave a review.';
  end if;

  if not exists (
    select 1
    from public.therapists t
    where t.profile_id = new.therapist_id
      and t.open_to_new_clients
      and t.listed
  ) then
    raise exception 'This therapist is not open to new clients.';
  end if;

  new.body := nullif(btrim(coalesce(new.body, '')), '');
  if new.body is not null and char_length(new.body) > 2000 then
    raise exception 'Keep the review under 2000 characters.';
  end if;

  if new.anonymous then
    new.author_name := null;
  else
    new.author_name := nullif(btrim(coalesce(new.author_name, '')), '');
    if new.author_name is null or char_length(new.author_name) > 80 then
      raise exception 'Add a display name, or post anonymously.';
    end if;
  end if;

  if new.stars_cat_1 is null
    or new.stars_cat_2 is null
    or new.stars_cat_3 is null
    or new.stars_cat_1 < 1 or new.stars_cat_1 > 5 or new.stars_cat_1 <> trunc(new.stars_cat_1)
    or new.stars_cat_2 < 1 or new.stars_cat_2 > 5 or new.stars_cat_2 <> trunc(new.stars_cat_2)
    or new.stars_cat_3 < 1 or new.stars_cat_3 > 5 or new.stars_cat_3 <> trunc(new.stars_cat_3)
  then
    raise exception 'Rate all three questions from 1 to 5.';
  end if;

  new.stars_avg := (new.stars_cat_1 + new.stars_cat_2 + new.stars_cat_3) / 3;

  return new;
end;
$$;

revoke all on function public.reviews_guard() from public, anon;
grant execute on function public.reviews_guard() to authenticated;
