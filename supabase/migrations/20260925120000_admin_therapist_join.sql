-- An admin can publish one therapist profile on the same account to test Join.
-- Role stays admin. A later join replaces that therapist profile, including a
-- leftover therapist row. Therapist and patient accounts still cannot join twice.
-- There is still no profiles DELETE policy.

create or replace function private.clear_own_admin_therapist_rows()
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
    raise exception 'Authentication is required to replace a therapist profile'
      using errcode = '42501';
  end if;

  select p.role
  into v_role
  from public.profiles p
  where p.id = v_id;

  if v_role is distinct from 'admin' then
    raise exception 'Only an admin can replace a therapist profile on this account'
      using errcode = '42501';
  end if;

  -- rates, licenses, qualifications, cards, and reviews about this profile
  -- cascade from therapists. Tags, location, and feedback hang off profiles.
  delete from public.therapists where profile_id = v_id;
  delete from public.tags where profile_id = v_id;
  delete from public.locations where profile_id = v_id;
  delete from public.feedback where profile_id = v_id;
end;
$$;

revoke all on function private.clear_own_admin_therapist_rows()
  from public, anon, authenticated, service_role;
grant execute on function private.clear_own_admin_therapist_rows()
  to authenticated;

comment on function private.clear_own_admin_therapist_rows() is
  'Clears the signed-in admin''s therapist rows so Join can replace them. Does not delete the profile, change role, or touch auth.users.';

create or replace function public.complete_therapist_join(
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
declare
  v_id uuid := auth.uid();
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
  if v_id is null then
    raise exception 'Authentication is required to complete therapist join'
      using errcode = '42501';
  end if;

  select p.role
  into v_role
  from public.profiles p
  where p.id = v_id;

  if v_role is not null and v_role is distinct from 'admin' then
    raise exception 'Therapist join has already been completed for this user';
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

  if v_role = 'admin' then
    perform private.clear_own_admin_therapist_rows();

    update public.profiles
    set
      name = btrim(p_name),
      email = p_email,
      phone = p_phone,
      about_me = p_about,
      photo_key = p_photo_key,
      video_key = p_video_key
    where id = v_id
      and role = 'admin';

    if not found then
      raise exception 'Admin profile was not updated';
    end if;
  else
    insert into public.profiles (
      id,
      role,
      name,
      email,
      phone,
      about_me,
      photo_key,
      video_key
    )
    values (
      v_id,
      'therapist',
      btrim(p_name),
      p_email,
      p_phone,
      p_about,
      p_photo_key,
      p_video_key
    );
  end if;

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
    );
  end if;

  insert into public.therapists (
    profile_id,
    credential,
    start_date_of_practice,
    open_to_new_clients,
    virtual_practice,
    in_person_practice,
    superbill,
    sliding_scale,
    sliding_scale_min_cents,
    sliding_scale_max_cents
  )
  values (
    v_id,
    p_credential,
    p_start_date,
    p_open_to_new_clients,
    p_virtual,
    p_in_person,
    p_superbill,
    v_sliding,
    v_scale_min,
    v_scale_max
  );

  insert into public.licenses (therapist_id, number, state)
  select v_id, btrim(license.number), btrim(license.state)
  from jsonb_to_recordset(coalesce(p_licenses, '[]'::jsonb))
    as license(number text, state text);

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

  insert into public.tags (profile_id, kind, label)
  select v_id, tag.kind, btrim(tag.label)
  from jsonb_to_recordset(coalesce(p_tags, '[]'::jsonb))
    as tag(kind text, label text);

  insert into public.profile_items (therapist_id, prompt, answer, tag)
  select v_id, item.prompt, item.answer, item.tag
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
    as item(prompt text, answer text, tag text);

  insert into public.qualifications (therapist_id, kind, label, position)
  select v_id, q.kind, btrim(q.label), coalesce(q.position, 0)
  from jsonb_to_recordset(coalesce(p_qualifications, '[]'::jsonb))
    as q(kind text, label text, position integer)
  where q.kind in ('education', 'credential')
    and btrim(coalesce(q.label, '')) <> '';

  if p_feedback is not null and btrim(p_feedback) <> '' then
    insert into public.feedback (profile_id, body)
    values (v_id, p_feedback);
  end if;

  return v_id;
end;
$$;

comment on function public.complete_therapist_join(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
) is
  'Creates a therapist profile for the signed-in user. An existing admin keeps role admin and replaces any previous therapist rows. Any other existing profile is rejected.';

revoke execute on function public.complete_therapist_join(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
) from public, anon;

grant execute on function public.complete_therapist_join(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
) to authenticated;

-- Find and /t/[id] read profiles through RLS. An admin test profile is public
-- only while that therapist row is open to new clients.
drop policy if exists profiles_select_public on public.profiles;

create policy profiles_select_public
on public.profiles
for select
to anon, authenticated
using (
  id = (select auth.uid())
  or (
    role in ('therapist', 'admin')
    and exists (
      select 1
      from public.therapists t
      where t.profile_id = profiles.id
        and t.open_to_new_clients
    )
  )
);

notify pgrst, 'reload schema';
