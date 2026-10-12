-- Draft vs published. `listed` stays the admin hide flag.
-- Public Find, sitemap, and /t/[id] require open + listed + published.
-- Existing rows backfill published = true (column default), so current
-- profiles stay live. A signed-in user cannot set published back to false.
-- Apply this on the hosted database before using Save as draft.
-- Find, an already-live Save changes, and Publish keep working on the
-- previous functions if this has not been applied yet. Save as draft
-- calls p_publish and fails until this migration runs.

alter table public.therapists
  add column published boolean not null default true;

comment on column public.therapists.published is
  'False is a draft: omitted from public Find, the sitemap, and /t/[id]. The owner can preview. A signed-in admin can preview. True stays true for API updates.';

create index therapists_open_listed_published_idx
  on public.therapists (profile_id)
  where open_to_new_clients and listed and published;

create or replace function private.guard_therapist_published()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and old.published
     and not new.published
     and (select auth.uid()) is not null
  then
    raise exception 'A published profile stays published'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_therapist_published()
  from public, anon, authenticated, service_role;

drop trigger if exists therapists_keep_published on public.therapists;

create trigger therapists_keep_published
before update on public.therapists
for each row
execute function private.guard_therapist_published();

-- Public read now also requires published. Owner policies are unchanged.
-- Admin still reads every therapist row, plus child rows for a draft.

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
        and t.listed
        and t.published
    )
  )
);

drop policy if exists therapists_select_public on public.therapists;

create policy therapists_select_public
on public.therapists
for select
to anon, authenticated
using (
  profile_id = (select auth.uid())
  or (open_to_new_clients and listed and published)
);

drop policy if exists rates_select_public on public.rates;

create policy rates_select_public
on public.rates
for select
to anon, authenticated
using (
  therapist_id = (select auth.uid())
  or exists (
    select 1
    from public.therapists t
    where t.profile_id = rates.therapist_id
      and t.open_to_new_clients
      and t.listed
      and t.published
  )
);

drop policy if exists licenses_select_public on public.licenses;

create policy licenses_select_public
on public.licenses
for select
to anon, authenticated
using (
  therapist_id = (select auth.uid())
  or exists (
    select 1
    from public.therapists t
    where t.profile_id = licenses.therapist_id
      and t.open_to_new_clients
      and t.listed
      and t.published
  )
);

drop policy if exists locations_select_public on public.locations;

create policy locations_select_public
on public.locations
for select
to anon, authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.therapists t
    where t.profile_id = locations.profile_id
      and t.open_to_new_clients
      and t.listed
      and t.published
  )
);

drop policy if exists tags_select_public on public.tags;

create policy tags_select_public
on public.tags
for select
to anon, authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.therapists t
    where t.profile_id = tags.profile_id
      and t.open_to_new_clients
      and t.listed
      and t.published
  )
);

drop policy if exists profile_items_select_public on public.profile_items;

create policy profile_items_select_public
on public.profile_items
for select
to anon, authenticated
using (
  therapist_id = (select auth.uid())
  or exists (
    select 1
    from public.therapists t
    where t.profile_id = profile_items.therapist_id
      and t.open_to_new_clients
      and t.listed
      and t.published
  )
);

drop policy if exists qualifications_select_public on public.qualifications;

create policy qualifications_select_public
on public.qualifications
for select
to anon, authenticated
using (
  therapist_id = (select auth.uid())
  or exists (
    select 1
    from public.therapists t
    where t.profile_id = qualifications.therapist_id
      and t.open_to_new_clients
      and t.listed
      and t.published
  )
);

drop policy if exists reviews_select_public on public.reviews;

create policy reviews_select_public
on public.reviews
for select
to anon, authenticated
using (
  status = 'approved'
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = reviews.therapist_id
      and t.open_to_new_clients
      and t.listed
      and t.published
  )
);

drop policy if exists rates_select_admin_draft on public.rates;
create policy rates_select_admin_draft
on public.rates
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = rates.therapist_id
      and not t.published
  )
);

drop policy if exists licenses_select_admin_draft on public.licenses;
create policy licenses_select_admin_draft
on public.licenses
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = licenses.therapist_id
      and not t.published
  )
);

drop policy if exists locations_select_admin_draft on public.locations;
create policy locations_select_admin_draft
on public.locations
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = locations.profile_id
      and not t.published
  )
);

drop policy if exists tags_select_admin_draft on public.tags;
create policy tags_select_admin_draft
on public.tags
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = tags.profile_id
      and not t.published
  )
);

drop policy if exists profile_items_select_admin_draft on public.profile_items;
create policy profile_items_select_admin_draft
on public.profile_items
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = profile_items.therapist_id
      and not t.published
  )
);

drop policy if exists qualifications_select_admin_draft on public.qualifications;
create policy qualifications_select_admin_draft
on public.qualifications
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = qualifications.therapist_id
      and not t.published
  )
);

-- Same search as 20261007220000, plus published.
-- Drop first: CREATE OR REPLACE cannot add a return column.

drop function if exists public.search_therapists(text[], boolean, boolean, text, integer, integer);

create function public.search_therapists(
  p_tags text[] default '{}',
  p_virtual boolean default false,
  p_in_person boolean default false,
  p_state text default null,
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  profile_id uuid,
  name text,
  photo_key text,
  credential text,
  start_date_of_practice date,
  min_price_cents integer,
  min_duration_minutes integer,
  virtual_practice boolean,
  in_person_practice boolean,
  specialty_labels text[],
  insurance_labels text[],
  match_count integer,
  matched_labels text[],
  sliding_scale boolean,
  listed boolean,
  published boolean,
  video_key text,
  card_prompt text,
  card_answer text,
  card_tag text
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_admin boolean := false;
begin
  if (select auth.uid()) is not null then
    v_admin := (select private.is_admin());
  end if;

  return query
  select
    p.id,
    p.name,
    p.photo_key,
    t.credential,
    t.start_date_of_practice,
    rate.min_price_cents,
    rate.min_duration_minutes,
    t.virtual_practice,
    t.in_person_practice,
    coalesce(spec.labels, '{}'::text[]),
    coalesce(ins.labels, '{}'::text[]),
    hits.match_count,
    hits.matched_labels,
    t.sliding_scale,
    t.listed,
    t.published,
    p.video_key,
    card.card_prompt,
    card.card_answer,
    card.card_tag
  from public.therapists t
  join public.profiles p on p.id = t.profile_id
  left join lateral (
    select
      r.price_cents::integer as min_price_cents,
      r.duration_minutes as min_duration_minutes
    from public.rates r
    where r.therapist_id = t.profile_id
    order by r.price_cents asc, r.duration_minutes asc
    limit 1
  ) rate on true
  left join lateral (
    select array_agg(tg.label order by tg.label) as labels
    from public.tags tg
    where tg.profile_id = t.profile_id and tg.kind = 'specialty'
  ) spec on true
  left join lateral (
    select array_agg(tg.label order by tg.label) as labels
    from public.tags tg
    where tg.profile_id = t.profile_id and tg.kind = 'insurance'
  ) ins on true
  left join lateral (
    select
      count(*)::integer as match_count,
      coalesce(array_agg(tg.label order by tg.label), '{}'::text[]) as matched_labels
    from (
      select distinct tg.label
      from public.tags tg
      where tg.profile_id = t.profile_id
        and tg.kind in ('specialty', 'insurance')
        and tg.label = any (coalesce(p_tags, '{}'::text[]))
    ) tg
  ) hits on true
  left join lateral (
    select
      item.prompt as card_prompt,
      item.answer as card_answer,
      item.tag as card_tag
    from public.profile_items item
    where item.therapist_id = t.profile_id
      and btrim(item.prompt) <> ''
      and btrim(item.answer) <> ''
    order by item.position asc, item.ctid
    limit 1
  ) card on true
  where t.open_to_new_clients
    and (t.listed or v_admin)
    and (t.published or v_admin)
    and (not p_virtual or t.virtual_practice)
    and (not p_in_person or t.in_person_practice)
    and (
      coalesce(cardinality(p_tags), 0) = 0
      or hits.match_count > 0
    )
    and (
      p_state is null
      or btrim(p_state) = ''
      or exists (
        select 1
        from public.licenses l
        where l.therapist_id = t.profile_id
          and l.state = p_state
      )
    )
  order by t.published asc, t.listed asc, hits.match_count desc, p.name
  limit least(greatest(coalesce(p_limit, 24), 1), 24)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

comment on function public.search_therapists(
  text[], boolean, boolean, text, integer, integer
) is
  'OR tag overlap on specialty/insurance; rank drafts, then unlisted, then match_count, then name; return matched_labels, min rate + duration, sliding_scale, listed, published, video_key, and the first conversation card by profile_items.position; optional format + license state; open practices only; unlisted or unpublished rows only when private.is_admin(); cap 24. One round trip. Video bytes are not read here.';

grant execute on function public.search_therapists(
  text[], boolean, boolean, text, integer, integer
) to anon, authenticated;

-- Shared write used by the owner update and by an admin editing someone else.
-- published = published OR p_publish, so a live profile stays live.

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
  p_publish boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
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
    end
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
  boolean, integer, integer, boolean
) from public, anon, authenticated, service_role;

grant execute on function private.save_therapist_profile(
  uuid,
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
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
  p_publish boolean default true
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
    p_publish
  );
end;
$$;

comment on function public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
) is
  'Saves the signed-in therapist profile. p_publish false keeps a draft. A profile that is already published stays published.';

revoke execute on function public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
) from public, anon;

grant execute on function public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
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
  p_publish boolean default true
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
    p_publish
  );
end;
$$;

comment on function public.admin_save_therapist_profile(
  uuid,
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
) is
  'Admin saves someone else''s therapist profile. Same draft and publish rules as the owner: a live profile stays live. Does not change role or listed, and does not file feedback as them.';

revoke all on function public.admin_save_therapist_profile(
  uuid,
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
) from public, anon, authenticated, service_role;

grant execute on function public.admin_save_therapist_profile(
  uuid,
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
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
  p_publish boolean default true
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
  boolean, integer, integer, boolean
) is
  'Creates the signed-in therapist profile. p_publish defaults true so join still goes live. p_publish false stores a draft. Replacing an already published profile stays published. An admin keeps role admin and a stashed listed flag.';

revoke execute on function public.complete_therapist_join(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
) from public, anon;

grant execute on function public.complete_therapist_join(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text,
  boolean, integer, integer, boolean
) to authenticated;

notify pgrst, 'reload schema';
