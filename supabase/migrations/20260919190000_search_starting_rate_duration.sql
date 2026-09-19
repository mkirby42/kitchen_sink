-- Search cards show the cheapest rate with its duration ($165 / 50 min).

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
  insurance_labels text[]
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
    coalesce(ins.labels, '{}'::text[])
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
  where t.open_to_new_clients
    and (not p_virtual or t.virtual_practice)
    and (not p_in_person or t.in_person_practice)
    and (
      coalesce(cardinality(p_tags), 0) = 0
      or exists (
        select 1
        from public.tags tg
        where tg.profile_id = t.profile_id
          and tg.kind in ('specialty', 'insurance')
          and tg.label = any (p_tags)
      )
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
  order by p.name
  limit least(greatest(coalesce(p_limit, 24), 1), 24)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

comment on function public.search_therapists is
  'OR tag overlap on specialty/insurance; optional format + license state; min rate + duration; cap 24. Seeded EXPLAIN ANALYZE ~4ms.';

grant execute on function public.search_therapists(
  text[], boolean, boolean, text, integer, integer
) to anon, authenticated;
