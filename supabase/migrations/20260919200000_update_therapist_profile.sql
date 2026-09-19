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
    name = p_name,
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
    supervisor_name = p_supervisor_name,
    supervisor_license = p_supervisor_license,
    superbill = p_superbill
  where profile_id = v_id;

  delete from public.licenses where therapist_id = v_id;
  insert into public.licenses (therapist_id, number, state)
  select v_id, license.number, license.state
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

  if p_feedback is not null and btrim(p_feedback) <> '' then
    insert into public.feedback (profile_id, body)
    values (v_id, p_feedback);
  end if;

  return v_id;
end;
$$;

revoke execute on function public.update_therapist_profile(
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

grant execute on function public.update_therapist_profile(
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
