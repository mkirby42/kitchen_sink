-- Find cards: intro video key + the first conversation card in saved order.
-- Still one search_therapists round trip. The page does not request the video
-- file until the play control is clicked.
--
-- profile_items had no order column. Inserts from join/update are one
-- jsonb array, row by row. A before-insert trigger assigns position with
-- nextval so that array order sticks. Existing rows are backfilled from
-- physical order (ctid), which is that insert order until a rewrite.

alter table public.profile_items
  add column position integer;

comment on column public.profile_items.position is
  'Saved order. Lower is first. Null on insert is filled by profile_items_assign_position.';

alter table public.profile_items disable trigger profile_items_card_count;

with ranked as (
  select
    id,
    (row_number() over (
      partition by therapist_id
      order by ctid
    ) - 1)::integer as pos
  from public.profile_items
)
update public.profile_items as item
set position = ranked.pos
from ranked
where item.id = ranked.id
  and item.position is null;

alter table public.profile_items enable trigger profile_items_card_count;

create sequence public.profile_items_position_seq;

select setval(
  'public.profile_items_position_seq',
  greatest(
    (select coalesce(max(position), 0) from public.profile_items),
    1
  )
);

grant usage, select on sequence public.profile_items_position_seq
  to anon, authenticated, service_role;

create or replace function public.profile_items_assign_position()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.position is null then
    new.position := nextval('public.profile_items_position_seq');
  end if;
  return new;
end;
$$;

drop trigger if exists profile_items_assign_position on public.profile_items;

create trigger profile_items_assign_position
before insert on public.profile_items
for each row
execute function public.profile_items_assign_position();

alter table public.profile_items
  alter column position set not null;

create index profile_items_therapist_position_idx
  on public.profile_items (therapist_id, position);

-- Recreate search_therapists from 20261007214457 and add video_key plus the
-- first conversation card. Keeps admin unlisted rows and the listed-first rank.

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
  'OR tag overlap on specialty/insurance; rank unlisted first for an admin, then match_count, then name; return matched_labels, min rate + duration, sliding_scale, listed, video_key, and the first conversation card by profile_items.position; optional format + license state; open practices only; unlisted rows only when private.is_admin(); cap 24. One round trip. Video bytes are not read here.';

grant execute on function public.search_therapists(
  text[], boolean, boolean, text, integer, integer
) to anon, authenticated;
