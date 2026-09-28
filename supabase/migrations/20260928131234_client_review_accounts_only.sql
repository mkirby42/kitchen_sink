-- Client accounts exist to leave reviews. Find does not save a search.
-- A patient row may keep the login email and the placeholder name Patient.
-- Phone, about, photo, video, tags, location, and feedback are practice data.
-- Review signup and the review form still warn about personal health
-- information. New reviews stay pending until an admin approves them.
-- This does not archive rejected reviews and does not delete storage bytes
-- (hosted storage.protect_delete).

create or replace function private.is_practice_owner(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_id is not null
    and p_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = p_id
        and p.role in ('therapist', 'admin')
    );
$$;

revoke all on function private.is_practice_owner(uuid)
  from public, anon, authenticated, service_role;
grant execute on function private.is_practice_owner(uuid) to authenticated;

comment on function private.is_practice_owner(uuid) is
  'True when this signed-in user is a therapist or admin. Patient review accounts are not practice owners.';

-- Drop leftover personal fields on client accounts. Do not delete the
-- profile or the reviews they wrote. A patient should not own practice rows;
-- if one does, those rows go away with it.
update public.profiles
set
  phone = null,
  about_me = null,
  photo_key = null,
  video_key = null
where role = 'patient'
  and (
    phone is not null
    or about_me is not null
    or photo_key is not null
    or video_key is not null
  );

delete from public.therapists t
using public.profiles p
where t.profile_id = p.id
  and p.role = 'patient';

delete from public.tags tg
using public.profiles p
where tg.profile_id = p.id
  and p.role = 'patient';

delete from public.locations l
using public.profiles p
where l.profile_id = p.id
  and p.role = 'patient';

delete from public.feedback f
using public.profiles p
where f.profile_id = p.id
  and p.role = 'patient';

drop policy if exists profiles_insert_own on public.profiles;

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (
  id = (select auth.uid())
  and (
    role = 'therapist'
    or (
      role = 'patient'
      and btrim(name) = 'Patient'
      and email is not distinct from (select auth.jwt() ->> 'email')
      and nullif(btrim(phone), '') is null
      and nullif(btrim(about_me), '') is null
      and nullif(btrim(photo_key), '') is null
      and nullif(btrim(video_key), '') is null
    )
  )
);

drop policy if exists profiles_update_own on public.profiles;

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select private.is_practice_owner(id)))
with check ((select private.is_practice_owner(id)));

drop policy if exists therapists_insert_own on public.therapists;

create policy therapists_insert_own
on public.therapists
for insert
to authenticated
with check ((select private.is_practice_owner(profile_id)));

drop policy if exists therapists_update_own on public.therapists;

create policy therapists_update_own
on public.therapists
for update
to authenticated
using ((select private.is_practice_owner(profile_id)))
with check ((select private.is_practice_owner(profile_id)));

drop policy if exists rates_write_own on public.rates;

create policy rates_write_own
on public.rates
for all
to authenticated
using ((select private.is_practice_owner(therapist_id)))
with check ((select private.is_practice_owner(therapist_id)));

drop policy if exists licenses_write_own on public.licenses;

create policy licenses_write_own
on public.licenses
for all
to authenticated
using ((select private.is_practice_owner(therapist_id)))
with check ((select private.is_practice_owner(therapist_id)));

drop policy if exists locations_write_own on public.locations;

create policy locations_write_own
on public.locations
for all
to authenticated
using ((select private.is_practice_owner(profile_id)))
with check ((select private.is_practice_owner(profile_id)));

drop policy if exists tags_write_own on public.tags;

create policy tags_write_own
on public.tags
for all
to authenticated
using ((select private.is_practice_owner(profile_id)))
with check ((select private.is_practice_owner(profile_id)));

drop policy if exists profile_items_write_own on public.profile_items;

create policy profile_items_write_own
on public.profile_items
for all
to authenticated
using ((select private.is_practice_owner(therapist_id)))
with check ((select private.is_practice_owner(therapist_id)));

drop policy if exists qualifications_write_own on public.qualifications;

create policy qualifications_write_own
on public.qualifications
for all
to authenticated
using ((select private.is_practice_owner(therapist_id)))
with check ((select private.is_practice_owner(therapist_id)));

drop policy if exists feedback_insert_own on public.feedback;

create policy feedback_insert_own
on public.feedback
for insert
to authenticated
with check ((select private.is_practice_owner(profile_id)));

-- A new therapist uploads a photo before the profile row exists. A patient
-- account cannot add photo or video objects.
drop policy if exists photos_videos_insert_own on storage.objects;

create policy photos_videos_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('photos', 'videos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'patient'
  )
);

drop policy if exists photos_videos_update_own on storage.objects;

create policy photos_videos_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id in ('photos', 'videos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'patient'
  )
)
with check (
  bucket_id in ('photos', 'videos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'patient'
  )
);

-- Delete stays available so a client can remove an object they uploaded
-- before the review account existed. They still cannot add or replace one.
drop policy if exists photos_videos_delete_own on storage.objects;

create policy photos_videos_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('photos', 'videos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Session length and "how long I saw them" are not on the review form.
-- End-user writes cannot store them. Admin approval still keeps the text
-- already on the row. Dashboard SQL (no user JWT) is unchanged.
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

  -- No end-user JWT: dashboard SQL and account deletion. Do not force pending.
  if (select auth.uid()) is null then
    if new.status is null or new.status not in ('pending', 'approved') then
      if tg_op = 'UPDATE' then
        new.status := coalesce(old.status, 'approved');
      else
        new.status := 'approved';
      end if;
    end if;

    if new.patient_id is null then
      if tg_op = 'UPDATE' then
        return new;
      end if;
      raise exception 'Sign in as a client to leave a review.';
    end if;
  elsif (select private.is_admin()) and tg_op = 'UPDATE'
    and new.patient_id is distinct from (select auth.uid())
  then
    -- Approve someone else's review only. Content stays what they submitted.
    -- Reject is a DELETE. An admin editing their own review falls through
    -- and is forced back to pending.
    new.author_name := old.author_name;
    new.anonymous := old.anonymous;
    new.patient_hidden := old.patient_hidden;
    new.stars_cat_1 := old.stars_cat_1;
    new.stars_cat_2 := old.stars_cat_2;
    new.stars_cat_3 := old.stars_cat_3;
    new.stars_avg := old.stars_avg;
    new.body := old.body;
    new.session_format := old.session_format;
    new.duration_label := old.duration_label;
    if new.status is distinct from 'approved' then
      raise exception 'Approve the review, or reject it to delete it.';
    end if;
    return new;
  elsif (select private.is_admin()) and tg_op = 'UPDATE'
    and new.patient_id is not distinct from (select auth.uid())
    and new.status = 'approved'
    and new.body is not distinct from old.body
    and new.author_name is not distinct from old.author_name
    and new.anonymous is not distinct from old.anonymous
    and new.patient_hidden is not distinct from old.patient_hidden
    and new.stars_cat_1 is not distinct from old.stars_cat_1
    and new.stars_cat_2 is not distinct from old.stars_cat_2
    and new.stars_cat_3 is not distinct from old.stars_cat_3
  then
    -- Queue approve of the admin's own pending review. Text is unchanged.
    return new;
  else
    new.status := 'pending';
    new.session_format := null;
    new.duration_label := null;
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

notify pgrst, 'reload schema';
