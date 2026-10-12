-- Profile-page edit and delete.
-- A therapist may delete only their own profile. An admin may delete any
-- therapist profile and save any therapist profile from the existing editor.
-- There is still no profiles DELETE policy. These functions are the path.
--
-- Deletion:
-- * role = therapist: delete the profiles row. Child rows cascade (licenses,
--   rates, qualifications, tags, cards, location, feedback, reviews about
--   them). auth.users stays so they can join again.
-- * role = admin with a practice: keep the admin profile and role. Clear the
--   therapist rows, tags, location, feedback, and photo/video keys. Stash
--   listed so a later Join stays unlisted if it was (Christine Lo, Matt Kirby).
-- Storage bytes are removed by the app, not SQL. Hosted Storage rejects
-- SQL deletes (storage.protect_delete).

create or replace function private.delete_therapist_profile(
  p_therapist_id uuid,
  p_confirm text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_role text;
begin
  if v_actor is null then
    raise exception 'Authentication is required to delete a therapist profile'
      using errcode = '42501';
  end if;

  if p_confirm is distinct from 'DELETE' then
    raise exception 'Type DELETE to confirm'
      using errcode = '22023';
  end if;

  if v_actor is distinct from p_therapist_id and not private.is_admin() then
    raise exception 'You can only delete your own therapist profile'
      using errcode = '42501';
  end if;

  select p.role
  into v_role
  from public.profiles p
  where p.id = p_therapist_id
  for update;

  if not found then
    raise exception 'No therapist profile to delete'
      using errcode = '42501';
  end if;

  if v_role = 'therapist' then
    delete from public.profiles
    where id = p_therapist_id
      and role = 'therapist';
    return;
  end if;

  if v_role = 'admin' and exists (
    select 1
    from public.therapists t
    where t.profile_id = p_therapist_id
  ) then
    insert into private.therapist_listing_hold (profile_id, listed)
    select t.profile_id, t.listed
    from public.therapists t
    where t.profile_id = p_therapist_id
    on conflict (profile_id) do update
    set listed = excluded.listed;

    -- rates, licenses, qualifications, cards, and reviews about this profile
    -- cascade from therapists. Tags, location, and feedback hang off profiles.
    delete from public.therapists where profile_id = p_therapist_id;
    delete from public.tags where profile_id = p_therapist_id;
    delete from public.locations where profile_id = p_therapist_id;
    delete from public.feedback where profile_id = p_therapist_id;

    update public.profiles
    set photo_key = null,
        video_key = null
    where id = p_therapist_id
      and role = 'admin';
    return;
  end if;

  raise exception 'No therapist profile to delete'
    using errcode = '42501';
end;
$$;

revoke all on function private.delete_therapist_profile(uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function private.delete_therapist_profile(uuid, text)
  to authenticated;

create or replace function public.delete_therapist_profile(
  p_therapist_id uuid,
  p_confirm text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.delete_therapist_profile(p_therapist_id, p_confirm);
end;
$$;

revoke all on function public.delete_therapist_profile(uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.delete_therapist_profile(uuid, text)
  to authenticated;

comment on function public.delete_therapist_profile(uuid, text) is
  'Deletes one therapist profile after p_confirm is DELETE. Caller must be that therapist or an admin. Therapist-role rows delete profiles (cascade). Admin-role practices clear therapist rows and keep the admin account. Does not delete auth.users.';

-- Admin save of someone else's editor. Does not change role or listed.
-- Feedback is ignored: an admin edit must not file a note as that therapist.
-- Photo and video keys, when set, must be one file under that therapist id.

create or replace function private.admin_update_therapist_profile(
  p_therapist_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_about text,
  p_photo_key text,
  p_video_key text,
  p_credential text,
  p_start_date date,
  p_open_to_new_clients boolean,
  p_virtual boolean,
  p_in_person boolean,
  p_superbill boolean,
  p_licenses jsonb,
  p_rates jsonb,
  p_location jsonb,
  p_tags jsonb,
  p_items jsonb,
  p_qualifications jsonb,
  p_feedback text,
  p_sliding_scale boolean default false,
  p_sliding_scale_min_cents integer default null,
  p_sliding_scale_max_cents integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := p_therapist_id;
  v_role text;
  v_sliding boolean := coalesce(p_sliding_scale, false);
  v_scale_min integer := case
    when coalesce(p_sliding_scale, false) then p_sliding_scale_min_cents
    else null
  end;
  v_scale_max integer := case
    when coalesce(p_sliding_scale, false) then p_sliding_scale_max_cents
    else null
  end;
begin
  if (select auth.uid()) is null or not private.is_admin() then
    raise exception 'Admin access is required'
      using errcode = '42501';
  end if;

  -- p_feedback is accepted so the editor can send its usual payload.
  -- It is not stored: an admin edit must not file a note as that therapist.

  select p.role
  into v_role
  from public.profiles p
  where p.id = v_id
  for update;

  if v_role is null or v_role not in ('therapist', 'admin') then
    raise exception 'No therapist profile to update'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.therapists t
    where t.profile_id = v_id
  ) then
    raise exception 'No therapist profile to update'
      using errcode = '42501';
  end if;

  if p_photo_key is not null and btrim(p_photo_key) <> '' and (
    split_part(p_photo_key, '/', 1) is distinct from v_id::text
    or split_part(p_photo_key, '/', 2) = ''
    or split_part(p_photo_key, '/', 3) <> ''
    or position('..' in p_photo_key) > 0
    or position(chr(92) in p_photo_key) > 0
  ) then
    raise exception 'Photo must stay in this profile folder';
  end if;

  if p_video_key is not null and btrim(p_video_key) <> '' and (
    split_part(p_video_key, '/', 1) is distinct from v_id::text
    or split_part(p_video_key, '/', 2) = ''
    or split_part(p_video_key, '/', 3) <> ''
    or position('..' in p_video_key) > 0
    or position(chr(92) in p_video_key) > 0
  ) then
    raise exception 'Video must stay in this profile folder';
  end if;

  if v_scale_min is not null and v_scale_min < 0 then
    raise exception 'Sliding scale minimum must be zero or more';
  end if;

  if v_scale_max is not null and v_scale_max < 0 then
    raise exception 'Sliding scale maximum must be zero or more';
  end if;

  if v_scale_min is not null and v_scale_max is not null and v_scale_min > v_scale_max then
    raise exception 'Sliding scale minimum cannot exceed the maximum';
  end if;

  perform public.assert_therapist_step1(p_name, p_licenses);

  if p_in_person
     and (
       p_location is null
       or p_location = 'null'::jsonb
       or jsonb_typeof(p_location) <> 'object'
     )
  then
    raise exception 'In-person practice requires a location';
  end if;

  update public.profiles
  set
    name = btrim(p_name),
    email = p_email,
    phone = p_phone,
    about_me = p_about,
    photo_key = nullif(btrim(p_photo_key), ''),
    video_key = nullif(btrim(p_video_key), '')
  where id = v_id
    and role = v_role;

  if p_in_person then
    insert into public.locations (
      profile_id,
      address,
      address2,
      state,
      zip,
      lat,
      lon
    )
    values (
      v_id,
      p_location ->> 'address',
      p_location ->> 'address2',
      p_location ->> 'state',
      p_location ->> 'zip',
      null,
      null
    )
    on conflict (profile_id) do update
    set
      address = excluded.address,
      address2 = excluded.address2,
      state = excluded.state,
      zip = excluded.zip;
  else
    delete from public.locations
    where profile_id = v_id;
  end if;

  -- listed is intentionally untouched.
  update public.therapists
  set
    credential = p_credential,
    start_date_of_practice = p_start_date,
    open_to_new_clients = p_open_to_new_clients,
    virtual_practice = p_virtual,
    in_person_practice = p_in_person,
    superbill = p_superbill,
    sliding_scale = v_sliding,
    sliding_scale_min_cents = v_scale_min,
    sliding_scale_max_cents = v_scale_max
  where profile_id = v_id;

  delete from public.licenses where therapist_id = v_id;
  insert into public.licenses (therapist_id, number, state)
  select v_id, btrim(license.number), btrim(license.state)
  from jsonb_to_recordset(coalesce(p_licenses, '[]'::jsonb))
    as license(number text, state text);

  delete from public.rates where therapist_id = v_id;
  insert into public.rates (
    therapist_id,
    service_type,
    duration_minutes,
    price_cents
  )
  select
    v_id,
    rate.service_type,
    rate.duration_minutes,
    rate.price_cents
  from jsonb_to_recordset(coalesce(p_rates, '[]'::jsonb))
    as rate(service_type text, duration_minutes integer, price_cents integer);

  delete from public.tags where profile_id = v_id;
  insert into public.tags (profile_id, kind, label)
  select v_id, tag.kind, btrim(tag.label)
  from jsonb_to_recordset(coalesce(p_tags, '[]'::jsonb))
    as tag(kind text, label text);

  delete from public.profile_items where therapist_id = v_id;
  insert into public.profile_items (therapist_id, prompt, answer, tag)
  select v_id, item.prompt, item.answer, item.tag
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
    as item(prompt text, answer text, tag text);

  delete from public.qualifications where therapist_id = v_id;
  insert into public.qualifications (therapist_id, kind, label, position)
  select v_id, q.kind, btrim(q.label), coalesce(q.position, 0)
  from jsonb_to_recordset(coalesce(p_qualifications, '[]'::jsonb))
    as q(kind text, label text, position integer)
  where q.kind in ('education', 'credential')
    and btrim(coalesce(q.label, '')) <> '';

  return v_id;
end;
$$;

revoke all on function private.admin_update_therapist_profile(
  uuid, text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
) from public, anon, authenticated, service_role;

grant execute on function private.admin_update_therapist_profile(
  uuid, text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
) to authenticated;

create or replace function public.admin_update_therapist_profile(
  p_therapist_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_about text,
  p_photo_key text,
  p_video_key text,
  p_credential text,
  p_start_date date,
  p_open_to_new_clients boolean,
  p_virtual boolean,
  p_in_person boolean,
  p_superbill boolean,
  p_licenses jsonb,
  p_rates jsonb,
  p_location jsonb,
  p_tags jsonb,
  p_items jsonb,
  p_qualifications jsonb,
  p_feedback text,
  p_sliding_scale boolean default false,
  p_sliding_scale_min_cents integer default null,
  p_sliding_scale_max_cents integer default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.admin_update_therapist_profile(
    p_therapist_id,
    p_name,
    p_email,
    p_phone,
    p_about,
    p_photo_key,
    p_video_key,
    p_credential,
    p_start_date,
    p_open_to_new_clients,
    p_virtual,
    p_in_person,
    p_superbill,
    p_licenses,
    p_rates,
    p_location,
    p_tags,
    p_items,
    p_qualifications,
    p_feedback,
    p_sliding_scale,
    p_sliding_scale_min_cents,
    p_sliding_scale_max_cents
  );
end;
$$;

revoke all on function public.admin_update_therapist_profile(
  uuid, text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
) from public, anon, authenticated, service_role;

grant execute on function public.admin_update_therapist_profile(
  uuid, text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
) to authenticated;

comment on function public.admin_update_therapist_profile(
  uuid, text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
) is
  'Admin saves one existing therapist profile. Does not change role or listed. Ignores feedback. Photo and video keys must stay under that therapist id.';

-- The editor has to read practice rows the public policies hide
-- (closed to new clients). Feedback stays owner-only.

drop policy if exists rates_select_admin on public.rates;
create policy rates_select_admin
on public.rates
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = rates.therapist_id
  )
);

drop policy if exists licenses_select_admin on public.licenses;
create policy licenses_select_admin
on public.licenses
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = licenses.therapist_id
  )
);

drop policy if exists locations_select_admin on public.locations;
create policy locations_select_admin
on public.locations
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = locations.profile_id
  )
);

drop policy if exists tags_select_admin on public.tags;
create policy tags_select_admin
on public.tags
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = tags.profile_id
  )
);

drop policy if exists profile_items_select_admin on public.profile_items;
create policy profile_items_select_admin
on public.profile_items
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = profile_items.therapist_id
  )
);

drop policy if exists qualifications_select_admin on public.qualifications;
create policy qualifications_select_admin
on public.qualifications
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = qualifications.therapist_id
  )
);

-- Delete objects after the therapist row is gone, so this does not require
-- the therapists row to still exist. Buckets stay photos and videos only.
drop policy if exists photos_videos_delete_admin on storage.objects;
create policy photos_videos_delete_admin
on storage.objects
for delete
to authenticated
using (
  (select private.is_admin())
  and bucket_id in ('photos', 'videos')
);

notify pgrst, 'reload schema';
