-- Therapists can offer a sliding scale from profile rates (join step 4 / edit).
-- The flag is enough to publish "sliding scale". Min/max cents are an optional range.
-- Rows that already stored a range are treated as offering a sliding scale.

alter table public.therapists
  add column sliding_scale boolean not null default false;

update public.therapists
set sliding_scale = true
where sliding_scale_min_cents is not null
   or sliding_scale_max_cents is not null;

alter table public.therapists
  add constraint therapists_sliding_scale_cents_check
  check (
    (sliding_scale_min_cents is null or sliding_scale_min_cents >= 0)
    and (sliding_scale_max_cents is null or sliding_scale_max_cents >= 0)
    and (
      sliding_scale_min_cents is null
      or sliding_scale_max_cents is null
      or sliding_scale_min_cents <= sliding_scale_max_cents
    )
  );

comment on column public.therapists.sliding_scale is
  'Offers a sliding scale. Optional sliding_scale_min_cents / sliding_scale_max_cents publish a range.';

-- Signature gains three trailing arguments. Drop the previous overload so
-- PostgREST does not see two complete_therapist_join / update_therapist_profile
-- functions that both match a named call.

drop function public.complete_therapist_join(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text
);

create function public.complete_therapist_join(
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

  if exists (
    select 1
    from public.profiles p
    where p.id = v_id
  ) then
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

drop function public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text
);

create function public.update_therapist_profile(
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
    raise exception 'Authentication is required to update a therapist profile'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.therapists t
    where t.profile_id = v_id
  ) then
    raise exception 'No therapist profile to update';
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
    photo_key = p_photo_key,
    video_key = p_video_key
  where id = v_id;

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

  if p_feedback is not null and btrim(p_feedback) <> '' then
    insert into public.feedback (profile_id, body)
    values (v_id, p_feedback);
  end if;

  return v_id;
end;
$$;

revoke execute on function public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
) from public, anon;

grant execute on function public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
) to authenticated;

-- Pre-qualifications clients call the supervisor overload. Keep their saves
-- from clearing a sliding scale they cannot see.
create or replace function public.update_therapist_profile(
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
  p_supervisor_name text,
  p_supervisor_license text,
  p_superbill boolean,
  p_licenses jsonb,
  p_rates jsonb,
  p_location jsonb,
  p_tags jsonb,
  p_items jsonb,
  p_feedback text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
  v_qualifications jsonb;
  v_sliding boolean;
  v_scale_min integer;
  v_scale_max integer;
begin
  -- p_supervisor_name and p_supervisor_license are accepted so the
  -- pre-qualifications call matches. Those columns were dropped.
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'kind', q.kind,
        'label', q.label,
        'position', q.position
      )
      order by q.position, q.kind, q.label
    ),
    '[]'::jsonb
  )
  into v_qualifications
  from public.qualifications q
  where q.therapist_id = v_id;

  select
    t.sliding_scale,
    t.sliding_scale_min_cents,
    t.sliding_scale_max_cents
  into v_sliding, v_scale_min, v_scale_max
  from public.therapists t
  where t.profile_id = v_id;

  return public.update_therapist_profile(
    p_name => p_name,
    p_email => p_email,
    p_phone => p_phone,
    p_about => p_about,
    p_photo_key => p_photo_key,
    p_video_key => p_video_key,
    p_credential => p_credential,
    p_start_date => p_start_date,
    p_open_to_new_clients => p_open_to_new_clients,
    p_virtual => p_virtual,
    p_in_person => p_in_person,
    p_superbill => p_superbill,
    p_licenses => p_licenses,
    p_rates => p_rates,
    p_location => p_location,
    p_tags => p_tags,
    p_items => p_items,
    p_qualifications => v_qualifications,
    p_feedback => p_feedback,
    p_sliding_scale => coalesce(v_sliding, false),
    p_sliding_scale_min_cents => v_scale_min,
    p_sliding_scale_max_cents => v_scale_max
  );
end;
$$;

notify pgrst, 'reload schema';
