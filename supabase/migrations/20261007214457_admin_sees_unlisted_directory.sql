-- Signed-in admins can see unlisted therapist profiles on Find and /t/[id].
-- Everyone else still requires therapists.listed. Sitemap is unchanged (listed only).
-- Does not update existing rows. Apply on the hosted project before relying on this.
-- private.is_admin() is only called when auth.uid() is set, so anon search
-- does not need execute on that function (anon has no usage on schema private).
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
  listed boolean
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
    t.listed
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
    and (t.listed or v_admin)
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
  order by t.listed asc, hits.match_count desc, p.name
  limit least(greatest(coalesce(p_limit, 24), 1), 24)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

comment on function public.search_therapists(
  text[], boolean, boolean, text, integer, integer
) is
  'OR tag overlap on specialty/insurance; rank unlisted first for an admin, then match_count, then name; return matched_labels, min rate + duration, sliding_scale, and listed; optional format + license state; open practices only; unlisted rows only when private.is_admin(); cap 24.';

grant execute on function public.search_therapists(
  text[], boolean, boolean, text, integer, integer
) to anon, authenticated;

-- Public select policies still require open + listed.
-- These add the unlisted child rows an admin needs for the card and profile.
-- Feedback stays owner-only. No patient-profile access.

drop policy if exists rates_select_admin_unlisted on public.rates;
create policy rates_select_admin_unlisted
on public.rates
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = rates.therapist_id
      and t.open_to_new_clients
      and not t.listed
  )
);

drop policy if exists licenses_select_admin_unlisted on public.licenses;
create policy licenses_select_admin_unlisted
on public.licenses
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = licenses.therapist_id
      and t.open_to_new_clients
      and not t.listed
  )
);

drop policy if exists locations_select_admin_unlisted on public.locations;
create policy locations_select_admin_unlisted
on public.locations
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = locations.profile_id
      and t.open_to_new_clients
      and not t.listed
  )
);

drop policy if exists tags_select_admin_unlisted on public.tags;
create policy tags_select_admin_unlisted
on public.tags
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = tags.profile_id
      and t.open_to_new_clients
      and not t.listed
  )
);

drop policy if exists profile_items_select_admin_unlisted on public.profile_items;
create policy profile_items_select_admin_unlisted
on public.profile_items
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = profile_items.therapist_id
      and t.open_to_new_clients
      and not t.listed
  )
);

drop policy if exists qualifications_select_admin_unlisted on public.qualifications;
create policy qualifications_select_admin_unlisted
on public.qualifications
for select
to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.therapists t
    where t.profile_id = qualifications.therapist_id
      and t.open_to_new_clients
      and not t.listed
  )
);

notify pgrst, 'reload schema';
