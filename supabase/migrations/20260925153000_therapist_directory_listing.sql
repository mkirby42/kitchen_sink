-- therapists.listed hides a profile from Find, the sitemap, and /t/[id].
-- The account, role, and therapist row stay. Admins toggle it later.
-- A therapist cannot change their own flag. An admin who re-joins keeps it.

alter table public.therapists
  add column listed boolean not null default true;

comment on column public.therapists.listed is
  'Public directory. False omits the profile from Find, sitemap, and /t/[id]. Does not delete the account.';

create index therapists_public_directory_idx
  on public.therapists (profile_id)
  where open_to_new_clients and listed;

create table private.therapist_listing_hold (
  profile_id uuid primary key,
  listed boolean not null
);

comment on table private.therapist_listing_hold is
  'Stashes listed across an admin Join replace, which deletes the therapist row.';

revoke all on table private.therapist_listing_hold
  from public, anon, authenticated, service_role;

create or replace function private.guard_therapist_listed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listed boolean;
begin
  if tg_op = 'INSERT' then
    select h.listed
    into v_listed
    from private.therapist_listing_hold h
    where h.profile_id = new.profile_id;

    if found then
      new.listed := v_listed;
      delete from private.therapist_listing_hold h
      where h.profile_id = new.profile_id;
    elsif (select auth.uid()) is not null and not private.is_admin() then
      new.listed := true;
    end if;

    return new;
  end if;

  if new.listed is distinct from old.listed
     and (select auth.uid()) is not null
     and not private.is_admin() then
    raise exception 'Only an admin can change directory listing'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_therapist_listed()
  from public, anon, authenticated, service_role;

drop trigger if exists therapists_guard_listed on public.therapists;

create trigger therapists_guard_listed
before insert or update on public.therapists
for each row
execute function private.guard_therapist_listed();

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

  insert into private.therapist_listing_hold (profile_id, listed)
  select t.profile_id, t.listed
  from public.therapists t
  where t.profile_id = v_id
  on conflict (profile_id) do update
  set listed = excluded.listed;

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
  'Clears the signed-in admin''s therapist rows so Join can replace them. Keeps the directory listing flag. Does not delete the profile, change role, or touch auth.users.';

-- Public read requires open_to_new_clients and listed.
-- Owner still reads their own rows. Admin still reads every therapist row.

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
  or (open_to_new_clients and listed)
);

drop policy if exists profiles_select_admin on public.profiles;

create policy profiles_select_admin
on public.profiles
for select
to authenticated
using (
  (select private.is_admin())
  and (
    role = 'therapist'
    or exists (
      select 1
      from public.therapists t
      where t.profile_id = profiles.id
    )
  )
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
  )
);

drop policy if exists reviews_select_public on public.reviews;

create policy reviews_select_public
on public.reviews
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.therapists t
    where t.profile_id = reviews.therapist_id
      and t.open_to_new_clients
      and t.listed
  )
);

-- Same overlap RPC as production, plus listed.
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
  matched_labels text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
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
    hits.matched_labels
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
  where t.open_to_new_clients
    and t.listed
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
  order by hits.match_count desc, p.name
  limit least(greatest(coalesce(p_limit, 24), 1), 24)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

comment on function public.search_therapists is
  'OR tag overlap on specialty/insurance; rank by match_count then name; return matched_labels; optional format + license state; min rate + duration; listed only; cap 24.';

grant execute on function public.search_therapists(
  text[], boolean, boolean, text, integer, integer
) to anon, authenticated;

create or replace function private.admin_set_therapist_listed(
  p_therapist_id uuid,
  p_listed boolean
)
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

  if p_therapist_id is null or p_listed is null then
    raise exception 'Therapist and listed flag are required';
  end if;

  update public.therapists
  set listed = p_listed
  where profile_id = p_therapist_id;

  if not found then
    raise exception 'Therapist profile not found';
  end if;
end;
$$;

revoke all on function private.admin_set_therapist_listed(uuid, boolean)
  from public, anon, authenticated, service_role;
grant execute on function private.admin_set_therapist_listed(uuid, boolean)
  to authenticated;

create or replace function public.admin_set_therapist_listed(
  p_therapist_id uuid,
  p_listed boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.admin_set_therapist_listed(p_therapist_id, p_listed);
end;
$$;

revoke all on function public.admin_set_therapist_listed(uuid, boolean)
  from public, anon, authenticated, service_role;
grant execute on function public.admin_set_therapist_listed(uuid, boolean)
  to authenticated;

comment on function public.admin_set_therapist_listed(uuid, boolean) is
  'Admin shows or hides one therapist on Find and the public profile. Does not delete the account or change role.';

-- Hide the two profiles Christine asked to take off Find.
-- Match id + email + name so a different database or a renamed row is left alone.
update public.therapists t
set listed = false
from public.profiles p
where p.id = t.profile_id
  and (p.id, lower(p.email), lower(btrim(p.name))) in (
    (
      'e635d882-fd07-4a7c-bd2e-145b1b71669a'::uuid,
      'chrislo5240@gmail.com',
      'christine lo'
    ),
    (
      'd6cb0940-b0b5-479c-93b6-595d1d340153'::uuid,
      'mkirbyfin@gmail.com',
      'matt kirby'
    )
  );

notify pgrst, 'reload schema';
