-- Step 1 identity: therapist name and each license number + state are required.
-- Education and certificate rows stay optional (zero qualifications is valid).
-- Seeded therapists already have a non-blank name and at least one license
-- number + state. This does not require qualifications.

alter table public.profiles
  add constraint profiles_therapist_name_not_blank
  check (role <> 'therapist' or name ~ '[[:graph:]]');

alter table public.licenses
  add constraint licenses_number_and_state_not_blank
  check (number ~ '[[:graph:]]' and state ~ '[[:graph:]]');

comment on table public.qualifications is
  'Optional education and certificate rows (kind education or credential). Zero rows is valid.';

create or replace function public.assert_therapist_step1(
  p_name text,
  p_licenses jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_name is null or p_name !~ '[[:graph:]]' then
    raise exception 'Name is required';
  end if;

  if p_licenses is null
     or jsonb_typeof(p_licenses) <> 'array'
     or jsonb_array_length(p_licenses) = 0
  then
    raise exception 'At least one state license is required';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_licenses) as license(number text, state text)
    where coalesce(license.number, '') !~ '[[:graph:]]'
       or coalesce(license.state, '') !~ '[[:graph:]]'
  ) then
    raise exception 'License number and state are required';
  end if;
end;
$$;

revoke all on function public.assert_therapist_step1(text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.assert_therapist_step1(text, jsonb) to authenticated;

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
  p_feedback text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
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
    superbill
  )
  values (
    v_id,
    p_credential,
    p_start_date,
    p_open_to_new_clients,
    p_virtual,
    p_in_person,
    p_superbill
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
  p_superbill boolean,
  p_licenses jsonb,
  p_rates jsonb,
  p_location jsonb,
  p_tags jsonb,
  p_items jsonb,
  p_qualifications jsonb,
  p_feedback text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
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
    superbill = p_superbill
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

