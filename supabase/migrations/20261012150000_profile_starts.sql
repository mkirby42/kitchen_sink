-- Therapists can ask Kitchen Sink to start a draft from links they already
-- have online. An admin builds the profile by hand. It stays unlisted until
-- the therapist publishes it.
--
-- Apply this file on the hosted database before using the form or
-- /admin/starts. Find, join, and existing profiles keep their current
-- behavior until it runs, and they keep it after: the new branches only
-- apply when a profile_starts row exists.
--
-- listed = false is the hidden switch this flow reuses. It is also how
-- admin-held profiles stay off Find. The shell is also published = false.
-- Do not treat every unlisted or unpublished row as one of these drafts.
-- A started draft is profile_starts.status in (drafting, ready) with
-- listed = false. The therapist's Publish profile sets both flags.

create table public.profile_starts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  links text[] not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'drafting', 'ready', 'published')),
  profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  admin_notified_at timestamptz,
  ready_notified_at timestamptz,
  constraint profile_starts_name_present
    check (char_length(name) between 1 and 120 and name ~ '[[:graph:]]'),
  constraint profile_starts_email_shape
    check (
      char_length(email) between 3 and 200
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ),
  constraint profile_starts_links_count
    check (cardinality(links) between 1 and 8)
);

comment on table public.profile_starts is
  'A therapist asked ops to start a draft from public profile links. status submitted → drafting (admin opened a hidden profile) → ready (login email sent) → published (the therapist published it). Links are not fetched.';

comment on column public.profile_starts.profile_id is
  'Auth user the draft was created for. Null until an admin starts it. The profile row is that user''s, listed false and published false until they publish.';

create index profile_starts_email_created_idx
  on public.profile_starts (email, created_at desc);

create index profile_starts_profile_idx
  on public.profile_starts (profile_id)
  where profile_id is not null;

alter table public.profile_starts enable row level security;

revoke all on public.profile_starts from public, anon;
grant select on public.profile_starts to authenticated;
revoke insert, update, delete on public.profile_starts from anon, authenticated;

create policy profile_starts_select_admin
on public.profile_starts
for select
to authenticated
using ((select private.is_admin()));

create policy profile_starts_select_own
on public.profile_starts
for select
to authenticated
using (profile_id = (select auth.uid()));

-- Incomplete shells (no license or rate yet) are allowed only while this
-- request is still a hidden draft. Publishing flips listed and the normal
-- checks apply again.

create or replace function public.therapists_require_license_and_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not new.listed and exists (
    select 1
    from public.profile_starts s
    where s.profile_id = new.profile_id
      and s.status in ('drafting', 'ready')
  ) then
    return new;
  end if;

  if not exists (
    select 1 from public.licenses l where l.therapist_id = new.profile_id
  ) then
    raise exception 'therapist requires at least one license';
  end if;
  if not exists (
    select 1 from public.rates r where r.therapist_id = new.profile_id
  ) then
    raise exception 'therapist requires at least one rate';
  end if;
  return new;
end;
$$;

-- Owner may list a started draft only through publish_started_profile,
-- which sets profile_start.publish for this transaction and checks the
-- profile is complete. Admins cannot list it early. Other listing changes
-- stay admin-only, including Christine and Matt's hidden profiles.

create or replace function private.guard_therapist_listed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listed boolean;
  v_started boolean;
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is not null and not private.is_admin() then
      new.listed := true;
      delete from private.therapist_listing_hold h
      where h.profile_id = new.profile_id;
      return new;
    end if;

    select h.listed
    into v_listed
    from private.therapist_listing_hold h
    where h.profile_id = new.profile_id;

    if found then
      new.listed := v_listed;
      delete from private.therapist_listing_hold h
      where h.profile_id = new.profile_id;
    elsif new.listed is null then
      new.listed := true;
    end if;

    return new;
  end if;

  if new.listed is not distinct from old.listed then
    return new;
  end if;

  v_started := new.listed = true
    and old.listed = false
    and exists (
      select 1
      from public.profile_starts s
      where s.profile_id = new.profile_id
        and s.status in ('drafting', 'ready')
    );

  if v_started then
    if (select auth.uid()) is distinct from new.profile_id
       or current_setting('profile_start.publish', true) is distinct from '1'
    then
      raise exception 'This draft stays hidden until the therapist publishes it'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if (select auth.uid()) is not null and not private.is_admin() then
    raise exception 'Only an admin can change directory listing'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_therapist_listed()
  from public, anon, authenticated, service_role;

-- A started draft stays unpublished until the owner calls
-- publish_started_profile. Other drafts still use p_publish.
-- A profile that is already published still cannot be unpublished.

create or replace function private.guard_therapist_published()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_started boolean;
begin
  if tg_op <> 'UPDATE' or (select auth.uid()) is null then
    return new;
  end if;

  if old.published and not new.published then
    raise exception 'A published profile stays published'
      using errcode = '42501';
  end if;

  v_started := not old.published
    and new.published
    and exists (
      select 1
      from public.profile_starts s
      where s.profile_id = new.profile_id
        and s.status in ('drafting', 'ready')
    );

  if v_started
     and (
       (select auth.uid()) is distinct from new.profile_id
       or current_setting('profile_start.publish', true) is distinct from '1'
     )
  then
    raise exception 'This draft stays unpublished until the therapist publishes it'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_therapist_published()
  from public, anon, authenticated, service_role;

-- Public form. No scraping. Rate limits are the abuse guard.

create or replace function public.submit_profile_start(
  p_name text,
  p_email text,
  p_links text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_links text[];
  v_id uuid;
  v_recent integer;
  v_hour integer;
begin
  if char_length(v_name) < 1 or char_length(v_name) > 120 or v_name !~ '[[:graph:]]' then
    raise exception 'Enter your name';
  end if;

  if char_length(v_email) < 3
     or char_length(v_email) > 200
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then
    raise exception 'Enter a valid email';
  end if;

  select coalesce(array_agg(btrim(link) order by ord), '{}'::text[])
  into v_links
  from unnest(coalesce(p_links, '{}'::text[])) with ordinality as item(link, ord)
  where btrim(link) <> '';

  if cardinality(v_links) < 1 or cardinality(v_links) > 8 then
    raise exception 'Add between 1 and 8 profile links';
  end if;

  if exists (
    select 1
    from unnest(v_links) as link
    where link !~ '^https?://'
      or char_length(link) > 500
      or link ~ '[[:space:]]'
  ) then
    raise exception 'Use a full http or https link';
  end if;

  select count(*)
  into v_recent
  from public.profile_starts s
  where s.email = v_email
    and s.created_at > now() - interval '24 hours';

  if v_recent >= 3 then
    raise exception 'We already have a recent request for that email';
  end if;

  select count(*)
  into v_hour
  from public.profile_starts s
  where s.created_at > now() - interval '1 hour';

  if v_hour >= 40 then
    raise exception 'Too many profile requests. Try again later';
  end if;

  insert into public.profile_starts (name, email, links)
  values (v_name, v_email, v_links)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_profile_start(text, text, text[])
  from public;
grant execute on function public.submit_profile_start(text, text, text[])
  to anon, authenticated;

create or replace function public.claim_profile_start_admin_email(p_id uuid)
returns table (
  request_id uuid,
  request_name text,
  request_email text,
  request_links text[],
  request_created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.profile_starts s
  set admin_notified_at = now()
  where s.id = p_id
    and s.admin_notified_at is null
    and s.created_at > now() - interval '2 hours'
  returning s.id, s.name, s.email, s.links, s.created_at;
end;
$$;

revoke all on function public.claim_profile_start_admin_email(uuid)
  from public;
grant execute on function public.claim_profile_start_admin_email(uuid)
  to anon, authenticated;

create or replace function public.release_profile_start_admin_email(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profile_starts s
  set admin_notified_at = null
  where s.id = p_id
    and s.created_at > now() - interval '2 hours';
end;
$$;

revoke all on function public.release_profile_start_admin_email(uuid)
  from public;
grant execute on function public.release_profile_start_admin_email(uuid)
  to anon, authenticated;

create or replace function public.admin_auth_user_id_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'Admin access is required'
      using errcode = '42501';
  end if;

  select u.id
  into v_id
  from auth.users u
  where lower(u.email) = lower(btrim(coalesce(p_email, '')))
  limit 1;

  return v_id;
end;
$$;

revoke all on function public.admin_auth_user_id_by_email(text)
  from public, anon;
grant execute on function public.admin_auth_user_id_by_email(text)
  to authenticated;

-- Creates the hidden therapist row for a request, or returns the one already
-- linked. Does not overwrite a profile that already existed, and does not
-- attach a draft to a client or admin login.

create or replace function public.admin_attach_started_profile(
  p_request_id uuid,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_email text;
  v_status text;
  v_profile uuid;
  v_role text;
  v_auth_email text;
  v_has_therapist boolean;
begin
  if not private.is_admin() then
    raise exception 'Admin access is required'
      using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'A therapist account is required';
  end if;

  select s.name, s.email, s.status, s.profile_id
  into v_name, v_email, v_status, v_profile
  from public.profile_starts s
  where s.id = p_request_id
  for update;

  if not found then
    raise exception 'Profile request not found';
  end if;

  if v_status = 'published' then
    raise exception 'That request is already published';
  end if;

  if v_profile is not null then
    if v_profile <> p_user_id then
      raise exception 'That request is already linked to a different profile';
    end if;
    return v_profile;
  end if;

  select lower(u.email)
  into v_auth_email
  from auth.users u
  where u.id = p_user_id;

  if v_auth_email is null or v_auth_email <> lower(v_email) then
    raise exception 'That account email does not match the request';
  end if;

  select p.role
  into v_role
  from public.profiles p
  where p.id = p_user_id;

  if v_role = 'patient' then
    raise exception 'That email is a client account. Ask them for a different email.';
  end if;

  if v_role = 'admin' then
    raise exception 'That email is an admin account. Use the therapist''s own email.';
  end if;

  select exists (
    select 1 from public.therapists t where t.profile_id = p_user_id
  )
  into v_has_therapist;

  if v_role = 'therapist' or v_has_therapist then
    raise exception 'That email already has a therapist profile. Edit it from Uploads.';
  end if;

  insert into public.profiles (id, role, name, email)
  values (p_user_id, 'therapist', v_name, v_email);

  insert into public.therapists (
    profile_id,
    open_to_new_clients,
    listed,
    published,
    virtual_practice,
    in_person_practice,
    sliding_scale,
    superbill
  )
  values (p_user_id, true, false, false, false, false, false, false);

  update public.profile_starts
  set
    profile_id = p_user_id,
    status = 'drafting'
  where id = p_request_id;

  return p_user_id;
end;
$$;

revoke all on function public.admin_attach_started_profile(uuid, uuid)
  from public, anon;
grant execute on function public.admin_attach_started_profile(uuid, uuid)
  to authenticated;

create or replace function public.admin_mark_profile_start_ready(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access is required'
      using errcode = '42501';
  end if;

  update public.profile_starts s
  set
    status = 'ready',
    ready_notified_at = now()
  where s.id = p_id
    and s.profile_id is not null
    and s.status in ('drafting', 'ready');

  if not found then
    raise exception 'Start the draft before emailing the therapist';
  end if;
end;
$$;

revoke all on function public.admin_mark_profile_start_ready(uuid)
  from public, anon;
grant execute on function public.admin_mark_profile_start_ready(uuid)
  to authenticated;

-- Older admin save. Does not change listed, role, published, or auth.
-- Draft and publish go through admin_save_therapist_profile (p_publish).
-- The checks live in 20261012143000_admin_manage_therapist_profile.sql.
-- This wrapper keeps that function (photo and video path, role, listed).

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

  select p.photo_key, p.video_key
  into v_photo, v_video
  from public.profiles p
  where p.id = v_id;

  if coalesce(btrim(v_photo), '') = '' then
    raise exception 'Add a photo before publishing';
  end if;

  if coalesce(btrim(v_video), '') = '' then
    raise exception 'Add an intro video before publishing';
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

revoke all on function public.publish_started_profile()
  from public, anon;
grant execute on function public.publish_started_profile()
  to authenticated;

-- Admin can read every practice row, including profiles closed to new
-- clients, so they can open the editor at any step. Feedback stays owner-only.

drop policy if exists rates_select_admin_any on public.rates;
create policy rates_select_admin_any
on public.rates
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.therapists t where t.profile_id = rates.therapist_id
  )
);

drop policy if exists licenses_select_admin_any on public.licenses;
create policy licenses_select_admin_any
on public.licenses
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.therapists t where t.profile_id = licenses.therapist_id
  )
);

drop policy if exists locations_select_admin_any on public.locations;
create policy locations_select_admin_any
on public.locations
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.therapists t where t.profile_id = locations.profile_id
  )
);

drop policy if exists tags_select_admin_any on public.tags;
create policy tags_select_admin_any
on public.tags
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.therapists t where t.profile_id = tags.profile_id
  )
);

drop policy if exists profile_items_select_admin_any on public.profile_items;
create policy profile_items_select_admin_any
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

drop policy if exists qualifications_select_admin_any on public.qualifications;
create policy qualifications_select_admin_any
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
