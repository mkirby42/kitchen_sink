-- Clients post one review per therapist. Public read stays on the open-therapist policy.
-- anonymous = hide the display name, not the review. patient_hidden still omits the row.

alter table public.reviews
  add column author_name text,
  add column anonymous boolean not null default false;

update public.reviews r
set author_name = nullif(btrim(p.name), '')
from public.profiles p
where p.id = r.patient_id
  and r.anonymous = false
  and r.author_name is null;

alter table public.reviews
  add constraint reviews_author_name_len
  check (author_name is null or char_length(author_name) between 1 and 80);

alter table public.reviews
  add constraint reviews_anonymous_name
  check (anonymous = false or author_name is null);

alter table public.reviews
  add constraint reviews_body_len
  check (body is not null and char_length(btrim(body)) between 1 and 2000);

alter table public.reviews
  add constraint reviews_stars_whole
  check (
    stars_avg is null
    or (
      stars_avg >= 1
      and stars_avg <= 5
      and stars_avg = trunc(stars_avg)
    )
  );

alter table public.reviews
  add constraint reviews_one_per_patient unique (therapist_id, patient_id);

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
      and p.role = 'patient'
  ) then
    raise exception 'Sign in as a client to leave a review.';
  end if;

  if not exists (
    select 1
    from public.therapists t
    where t.profile_id = new.therapist_id
      and t.open_to_new_clients
  ) then
    raise exception 'This therapist is not open to new clients.';
  end if;

  new.body := btrim(coalesce(new.body, ''));
  if char_length(new.body) < 1 or char_length(new.body) > 2000 then
    raise exception 'Write a short review.';
  end if;

  if new.anonymous then
    new.author_name := null;
  else
    new.author_name := nullif(btrim(coalesce(new.author_name, '')), '');
    if new.author_name is null or char_length(new.author_name) > 80 then
      raise exception 'Add a display name, or post anonymously.';
    end if;
  end if;

  if new.stars_avg is not null and (
    new.stars_avg < 1
    or new.stars_avg > 5
    or new.stars_avg <> trunc(new.stars_avg)
  ) then
    raise exception 'Rating must be a whole number from 1 to 5.';
  end if;

  return new;
end;
$$;

create trigger reviews_guard
before insert or update on public.reviews
for each row
execute function public.reviews_guard();

revoke all on function public.reviews_guard() from public, anon;
grant execute on function public.reviews_guard() to authenticated;

create policy reviews_insert_patient
on public.reviews
for insert
to authenticated
with check (patient_id = (select auth.uid()));

create policy reviews_update_own
on public.reviews
for update
to authenticated
using (patient_id = (select auth.uid()))
with check (patient_id = (select auth.uid()));

create policy reviews_delete_own
on public.reviews
for delete
to authenticated
using (patient_id = (select auth.uid()));

-- Interest removal dropped this. A new account still needs a patient row
-- before the review guard will accept the insert.
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

  if v_role = 'patient' then
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
