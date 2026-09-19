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
    p_name,
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
    supervisor_name,
    supervisor_license,
    superbill
  )
  values (
    v_id,
    p_credential,
    p_start_date,
    p_open_to_new_clients,
    p_virtual,
    p_in_person,
    p_supervisor_name,
    p_supervisor_license,
    p_superbill
  );

  insert into public.licenses (therapist_id, number, state)
  select v_id, license.number, license.state
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

  if p_feedback is not null and btrim(p_feedback) <> '' then
    insert into public.feedback (profile_id, body)
    values (v_id, p_feedback);
  end if;

  return v_id;
end;
$$;

revoke execute on function public.complete_therapist_join(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  boolean,
  boolean,
  boolean,
  text,
  text,
  boolean,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  text
) from public, anon;

grant execute on function public.complete_therapist_join(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  boolean,
  boolean,
  boolean,
  text,
  text,
  boolean,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  text
) to authenticated;
