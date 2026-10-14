-- Voice prompt: a short recording plus a title on profiles.
-- Publish requires a photo and at least one of intro video or voice prompt.
-- Drafts may omit all three. No new environment variables.
-- Apply this file on the hosted database before merging the app.

alter table public.profiles
  add column if not exists voice_key text,
  add column if not exists voice_prompt text;

alter table public.profiles
  drop constraint if exists profiles_voice_pair;

alter table public.profiles
  add constraint profiles_voice_pair check (
    (
      nullif(btrim(voice_key), '') is null
      and nullif(btrim(voice_prompt), '') is null
    )
    or (
      nullif(btrim(voice_key), '') is not null
      and char_length(btrim(voice_prompt)) between 1 and 80
    )
  );

comment on column public.profiles.voice_key is
  'Storage key in the voice bucket. With voice_prompt, this can publish a profile that has a photo and no intro video.';
comment on column public.profiles.voice_prompt is
  'Short title shown on the voice prompt card. Required when voice_key is set. Max 80 characters.';

create or replace function private.checked_voice(
  p_owner uuid,
  p_key text,
  p_prompt text
)
returns table (voice_key text, voice_prompt text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_key text := nullif(btrim(p_key), '');
  v_prompt text := nullif(
    btrim(replace(replace(coalesce(p_prompt, ''), E'\n', ' '), E'\r', ' ')),
    ''
  );
begin
  if v_key is null then
    voice_key := null;
    voice_prompt := null;
    return next;
    return;
  end if;

  if v_prompt is null or char_length(v_prompt) > 80 then
    raise exception 'A voice prompt needs a short title (80 characters or fewer)'
      using errcode = '23514';
  end if;

  if p_owner is null
     or split_part(v_key, '/', 1) is distinct from p_owner::text
     or split_part(v_key, '/', 2) = ''
     or split_part(v_key, '/', 3) <> ''
     or position('..' in v_key) > 0
     or position(chr(92) in v_key) > 0
  then
    raise exception 'Voice recording must stay in this profile folder'
      using errcode = '23514';
  end if;

  voice_key := v_key;
  voice_prompt := v_prompt;
  return next;
end;
$$;

revoke all on function private.checked_voice(uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function private.checked_voice(uuid, text, text)
  to authenticated;

comment on function private.checked_voice(uuid, text, text) is
  'Normalizes a voice storage key and title. A blank key clears both. A key requires a 1-80 character title in that profile folder.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice',
  'voice',
  true,
  8388608,
  array[
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/ogg',
    'audio/aac',
    'audio/x-m4a',
    'audio/m4a',
    'audio/mp3'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists voice_public_read on storage.objects;
create policy voice_public_read
on storage.objects
for select
to public
using (bucket_id = 'voice');

drop policy if exists voice_insert_own on storage.objects;
create policy voice_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'voice'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'patient'
  )
);

drop policy if exists voice_update_own on storage.objects;
create policy voice_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'voice'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'patient'
  )
)
with check (
  bucket_id = 'voice'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'patient'
  )
);

drop policy if exists voice_delete_own on storage.objects;
create policy voice_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'voice'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists voice_insert_admin on storage.objects;
create policy voice_insert_admin
on storage.objects
for insert
to authenticated
with check (
  (select private.is_admin())
  and bucket_id = 'voice'
  and exists (
    select 1
    from public.therapists t
    where t.profile_id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists voice_update_admin on storage.objects;
create policy voice_update_admin
on storage.objects
for update
to authenticated
using (
  (select private.is_admin())
  and bucket_id = 'voice'
  and exists (
    select 1
    from public.therapists t
    where t.profile_id::text = (storage.foldername(name))[1]
  )
)
with check (
  (select private.is_admin())
  and bucket_id = 'voice'
  and exists (
    select 1
    from public.therapists t
    where t.profile_id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists voice_delete_admin on storage.objects;
create policy voice_delete_admin
on storage.objects
for delete
to authenticated
using (
  (select private.is_admin())
  and bucket_id = 'voice'
);

-- A patient review account still cannot store practice media.
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
      and nullif(btrim(voice_key), '') is null
      and nullif(btrim(voice_prompt), '') is null
    )
  )
);

create or replace function private.require_publish_media()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.published is not true then
    return new;
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = new.profile_id
      and nullif(btrim(p.photo_key), '') is not null
      and (
        nullif(btrim(p.video_key), '') is not null
        or (
          nullif(btrim(p.voice_key), '') is not null
          and nullif(btrim(p.voice_prompt), '') is not null
        )
      )
  ) then
    raise exception 'A photo and either a short intro video or a voice prompt are required to publish'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function private.require_publish_media() is
  'Blocks insert or published-column updates that would leave a profile published without a photo and either an intro video or a voice prompt. Drafts may omit all three.';


create or replace function public.publish_started_profile()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := (select auth.uid());
  v_photo text;
  v_video text;
  v_voice text;
  v_voice_prompt text;
  v_cards integer;
begin
  if v_id is null then
    raise exception 'Sign in to publish your profile'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profile_starts s
    where s.profile_id = v_id
      and s.status in ('drafting', 'ready')
  ) then
    raise exception 'There is no draft waiting to publish';
  end if;

  select p.photo_key, p.video_key, p.voice_key, p.voice_prompt
  into v_photo, v_video, v_voice, v_voice_prompt
  from public.profiles p
  where p.id = v_id;

  if coalesce(btrim(v_photo), '') = '' then
    raise exception 'Add a photo before publishing';
  end if;

  if coalesce(btrim(v_video), '') = ''
     and (
       coalesce(btrim(v_voice), '') = ''
       or coalesce(btrim(v_voice_prompt), '') = ''
     )
  then
    raise exception 'Add an intro video or a voice prompt before publishing';
  end if;

  if not exists (
    select 1
    from public.licenses l
    where l.therapist_id = v_id
      and l.number ~ '[[:graph:]]'
      and l.state ~ '[[:graph:]]'
  ) then
    raise exception 'Add a state license before publishing';
  end if;

  if not exists (
    select 1
    from public.rates r
    where r.therapist_id = v_id
      and r.price_cents >= 100
  ) then
    raise exception 'Add a rate before publishing';
  end if;

  select count(*)
  into v_cards
  from public.profile_items i
  where i.therapist_id = v_id;

  if v_cards < 3 or v_cards > 6 then
    raise exception 'Add 3 to 6 conversation cards before publishing';
  end if;

  perform set_config('profile_start.publish', '1', true);

  update public.therapists
  set
    listed = true,
    published = true
  where profile_id = v_id
    and listed = false;

  if not found then
    raise exception 'This draft is already public';
  end if;

  update public.profile_starts
  set status = 'published'
  where profile_id = v_id
    and status in ('drafting', 'ready');

  return v_id;
end;
$$;


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
        video_key = null,
        voice_key = null,
        voice_prompt = null
    where id = p_therapist_id
      and role = 'admin';
    return;
  end if;

  raise exception 'No therapist profile to delete'
    using errcode = '42501';
end;
$$;



drop function if exists public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
);

drop function if exists public.admin_save_therapist_profile(
  uuid,
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
);

drop function if exists public.complete_therapist_join(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
);

drop function if exists private.save_therapist_profile(
  uuid,
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
);

create or replace function private.save_therapist_profile(
  p_id uuid,
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
  p_sliding_scale boolean,
  p_sliding_scale_min_cents integer,
  p_sliding_scale_max_cents integer,
  p_publish boolean,
  p_voice_key text default null,
  p_voice_prompt text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sliding boolean := coalesce(p_sliding_scale, false);
  v_voice_key text;
  v_voice_prompt text;
  v_scale_min integer := case
    when coalesce(p_sliding_scale, false) then p_sliding_scale_min_cents
    else null
  end;
  v_scale_max integer := case
    when coalesce(p_sliding_scale, false) then p_sliding_scale_max_cents
    else null
  end;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required to update a therapist profile'
      using errcode = '42501';
  end if;

  if p_id is distinct from (select auth.uid())
     and not (select private.is_admin())
  then
    raise exception 'You can only update your own therapist profile'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.therapists t
    where t.profile_id = p_id
  ) then
    raise exception 'No therapist profile to update';
  end if;

  -- An admin editing someone else cannot point media at another folder.
  if p_id is distinct from (select auth.uid()) then
    if p_photo_key is not null and btrim(p_photo_key) <> '' and (
      split_part(p_photo_key, '/', 1) is distinct from p_id::text
      or split_part(p_photo_key, '/', 2) = ''
      or split_part(p_photo_key, '/', 3) <> ''
      or position('..' in p_photo_key) > 0
      or position(chr(92) in p_photo_key) > 0
    ) then
      raise exception 'Photo must stay in this profile folder';
    end if;

    if p_video_key is not null and btrim(p_video_key) <> '' and (
      split_part(p_video_key, '/', 1) is distinct from p_id::text
      or split_part(p_video_key, '/', 2) = ''
      or split_part(p_video_key, '/', 3) <> ''
      or position('..' in p_video_key) > 0
      or position(chr(92) in p_video_key) > 0
    ) then
      raise exception 'Video must stay in this profile folder';
    end if;
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

  select c.voice_key, c.voice_prompt
  into v_voice_key, v_voice_prompt
  from private.checked_voice(p_id, p_voice_key, p_voice_prompt) as c;

  update public.profiles
  set
    name = btrim(p_name),
    email = p_email,
    phone = p_phone,
    about_me = p_about,
    photo_key = case
      when p_id is distinct from (select auth.uid()) then nullif(btrim(p_photo_key), '')
      else p_photo_key
    end,
    video_key = case
      when p_id is distinct from (select auth.uid()) then nullif(btrim(p_video_key), '')
      else p_video_key
    end,
    voice_key = v_voice_key,
    voice_prompt = v_voice_prompt
  where id = p_id;

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
      p_id,
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
    where profile_id = p_id;
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
    sliding_scale_max_cents = v_scale_max,
    published = published or coalesce(p_publish, true)
  where profile_id = p_id;

  delete from public.licenses where therapist_id = p_id;
  insert into public.licenses (therapist_id, number, state)
  select p_id, btrim(license.number), btrim(license.state)
  from jsonb_to_recordset(coalesce(p_licenses, '[]'::jsonb))
    as license(number text, state text);

  delete from public.rates where therapist_id = p_id;
  insert into public.rates (
    therapist_id,
    service_type,
    duration_minutes,
    price_cents
  )
  select
    p_id,
    rate.service_type,
    rate.duration_minutes,
    rate.price_cents
  from jsonb_to_recordset(coalesce(p_rates, '[]'::jsonb))
    as rate(service_type text, duration_minutes integer, price_cents integer);

  delete from public.tags where profile_id = p_id;
  insert into public.tags (profile_id, kind, label)
  select p_id, tag.kind, btrim(tag.label)
  from jsonb_to_recordset(coalesce(p_tags, '[]'::jsonb))
    as tag(kind text, label text);

  delete from public.profile_items where therapist_id = p_id;
  insert into public.profile_items (therapist_id, prompt, answer, tag)
  select p_id, item.prompt, item.answer, item.tag
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
    as item(prompt text, answer text, tag text);

  delete from public.qualifications where therapist_id = p_id;
  insert into public.qualifications (therapist_id, kind, label, position)
  select p_id, q.kind, btrim(q.label), coalesce(q.position, 0)
  from jsonb_to_recordset(coalesce(p_qualifications, '[]'::jsonb))
    as q(kind text, label text, position integer)
  where q.kind in ('education', 'credential')
    and btrim(coalesce(q.label, '')) <> '';

  -- An admin edit must not file a note as that therapist.
  if p_id is not distinct from (select auth.uid())
     and p_feedback is not null
     and btrim(p_feedback) <> '' then
    insert into public.feedback (profile_id, body)
    values (p_id, p_feedback);
  end if;

  return p_id;
end;
$$;

revoke all on function private.save_therapist_profile(
  uuid,
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean,
  text, text
) from public, anon, authenticated, service_role;

grant execute on function private.save_therapist_profile(
  uuid,
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean,
  text, text
) to authenticated;

drop function if exists public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
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
  p_sliding_scale_max_cents integer default null,
  p_publish boolean default true,
  p_voice_key text default null,
  p_voice_prompt text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required to update a therapist profile'
      using errcode = '42501';
  end if;

  return private.save_therapist_profile(
    (select auth.uid()),
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
    p_sliding_scale_max_cents,
    p_publish,
    p_voice_key,
    p_voice_prompt
  );
end;
$$;

comment on function public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean,
  text, text
) is
  'Saves the signed-in therapist profile. p_publish false keeps a draft. A profile that is already published stays published.';

revoke execute on function public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean,
  text, text
) from public, anon;

grant execute on function public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean,
  text, text
) to authenticated;

create or replace function public.admin_save_therapist_profile(
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
  p_sliding_scale_max_cents integer default null,
  p_publish boolean default true,
  p_voice_key text default null,
  p_voice_prompt text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'Admin access is required'
      using errcode = '42501';
  end if;

  return private.save_therapist_profile(
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
    p_sliding_scale_max_cents,
    p_publish,
    p_voice_key,
    p_voice_prompt
  );
end;
$$;

comment on function public.admin_save_therapist_profile(
  uuid,
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean,
  text, text
) is
  'Admin saves someone else''s therapist profile. Same draft and publish rules as the owner: a live profile stays live. Does not change role or listed, and does not file feedback as them.';

revoke all on function public.admin_save_therapist_profile(
  uuid,
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean,
  text, text
) from public, anon, authenticated, service_role;

grant execute on function public.admin_save_therapist_profile(
  uuid,
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean,
  text, text
) to authenticated;

-- First publish and Save as draft during join. Replacing an already
-- published admin test profile cannot turn it into a draft.

drop function if exists public.complete_therapist_join(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer
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
  p_sliding_scale_max_cents integer default null,
  p_publish boolean default true,
  p_voice_key text default null,
  p_voice_prompt text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
  v_role text;
  v_keep_published boolean := false;
  v_sliding boolean := coalesce(p_sliding_scale, false);
  v_voice_key text;
  v_voice_prompt text;
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

  select c.voice_key, c.voice_prompt
  into v_voice_key, v_voice_prompt
  from private.checked_voice(v_id, p_voice_key, p_voice_prompt) as c;

  select t.published
  into v_keep_published
  from public.therapists t
  where t.profile_id = v_id;

  v_keep_published := coalesce(v_keep_published, false);

  if v_role = 'admin' then
    perform private.clear_own_admin_therapist_rows();

    update public.profiles
    set
      name = btrim(p_name),
      email = p_email,
      phone = p_phone,
      about_me = p_about,
      photo_key = p_photo_key,
      video_key = p_video_key,
      voice_key = v_voice_key,
      voice_prompt = v_voice_prompt
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
      video_key,
      voice_key,
      voice_prompt
    )
    values (
      v_id,
      'therapist',
      btrim(p_name),
      p_email,
      p_phone,
      p_about,
      p_photo_key,
      p_video_key,
      v_voice_key,
      v_voice_prompt
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
    listed,
    published,
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
    coalesce(p_open_to_new_clients, true),
    true,
    v_keep_published or coalesce(p_publish, true),
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
  boolean, integer, integer, boolean,
  text, text
) is
  'Creates the signed-in therapist profile. p_publish defaults true so join still goes live. p_publish false stores a draft. Replacing an already published profile stays published. An admin keeps role admin and a stashed listed flag.';

revoke execute on function public.complete_therapist_join(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean,
  text, text
) from public, anon;

grant execute on function public.complete_therapist_join(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean,
  text, text
) to authenticated;



create or replace function private.admin_set_therapist_voice(
  p_therapist_id uuid,
  p_key text,
  p_prompt text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
  v_prompt text;
begin
  if not private.is_admin() then
    raise exception 'Admin access is required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.therapists t
    join public.profiles p on p.id = t.profile_id
    where t.profile_id = p_therapist_id
      and p.role = 'therapist'
  ) then
    raise exception 'Therapist profile not found';
  end if;

  select c.voice_key, c.voice_prompt
  into v_key, v_prompt
  from private.checked_voice(p_therapist_id, p_key, p_prompt) as c;

  update public.profiles
  set
    voice_key = v_key,
    voice_prompt = v_prompt
  where id = p_therapist_id
    and role = 'therapist';

  if not found then
    raise exception 'Therapist profile not found';
  end if;
end;
$$;

revoke all on function private.admin_set_therapist_voice(uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function private.admin_set_therapist_voice(uuid, text, text)
  to authenticated;

create or replace function public.admin_set_therapist_voice(
  p_therapist_id uuid,
  p_key text,
  p_prompt text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.admin_set_therapist_voice(p_therapist_id, p_key, p_prompt);
end;
$$;

revoke all on function public.admin_set_therapist_voice(uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.admin_set_therapist_voice(uuid, text, text)
  to authenticated;

comment on function public.admin_set_therapist_voice(uuid, text, text) is
  'Admin sets or clears voice_key and voice_prompt for one therapist. A blank key clears both. Does not change photo, video, or other profile fields.';

notify pgrst, 'reload schema';
