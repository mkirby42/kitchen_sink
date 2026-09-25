-- Session length is a whole number of minutes (1–480), not a fixed list.
-- Find cards also return whether the therapist offers a sliding scale.
-- Same search RPC: OR tag overlap, rank by match_count, one round trip.

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'rates'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%duration_minutes%'
  loop
    execute format('alter table public.rates drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.rates
  add constraint rates_duration_minutes_check
  check (duration_minutes >= 1 and duration_minutes <= 480);

comment on column public.therapists.sliding_scale is
  'Offers a sliding scale. The join form is a checkbox. Saves clear sliding_scale_min_cents and sliding_scale_max_cents.';

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
  sliding_scale boolean
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
    hits.matched_labels,
    t.sliding_scale
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
  'OR tag overlap on specialty/insurance; rank by match_count then name; return matched_labels, min rate + duration, and sliding_scale; optional format + license state; listed only; cap 24.';

grant execute on function public.search_therapists(
  text[], boolean, boolean, text, integer, integer
) to anon, authenticated;
