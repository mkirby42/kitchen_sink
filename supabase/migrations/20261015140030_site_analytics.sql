-- Anonymous site analytics.
-- Stores a random visitor id and session id, a path, and (for some events)
-- a therapist id and which booking button. No IP, email, account id, or
-- user agent. Apply this file before /admin/analytics can return numbers.
-- Do not add a new env var for it.

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visitor_id uuid not null,
  session_id uuid not null,
  event text not null,
  path text not null,
  therapist_id uuid,
  cta text,
  constraint analytics_events_event_check check (
    event in ('page_view', 'card_click', 'profile_view', 'cta_click')
  ),
  constraint analytics_events_cta_check check (
    cta is null or cta in ('book', 'consult')
  ),
  constraint analytics_events_path_check check (
    char_length(path) between 1 and 180
    and path ~ '^/[A-Za-z0-9/_.~-]*$'
    and path !~ '//'
    and path !~ '\.\.'
    and position('@' in path) = 0
    and position('?' in path) = 0
    and position('#' in path) = 0
  ),
  constraint analytics_events_payload_check check (
    (
      event = 'page_view'
      and therapist_id is null
      and cta is null
    )
    or (
      event = 'card_click'
      and therapist_id is not null
      and cta is null
    )
    or (
      event = 'profile_view'
      and therapist_id is not null
      and cta is null
    )
    or (
      event = 'cta_click'
      and therapist_id is not null
      and cta is not null
    )
  )
);

comment on table public.analytics_events is
  'Anonymous product analytics. visitor_id and session_id are random browser ids, not accounts. No IP address or other PII.';

create index analytics_events_created_event_idx
  on public.analytics_events (created_at, event);

create index analytics_events_visitor_created_idx
  on public.analytics_events (visitor_id, created_at desc);

create index analytics_events_therapist_created_idx
  on public.analytics_events (therapist_id, created_at)
  where therapist_id is not null;

alter table public.analytics_events enable row level security;

revoke all on table public.analytics_events from anon, authenticated;

grant insert (
  visitor_id,
  session_id,
  event,
  path,
  therapist_id,
  cta
) on table public.analytics_events to anon, authenticated;

grant select on table public.analytics_events to authenticated;

-- Signed-out visitors insert. They cannot choose id or created_at.
create policy analytics_events_insert_anon
on public.analytics_events
for insert
to anon
with check (true);

-- A signed-in admin's own session cannot write. The browser tracker also
-- stays off for admins; this is the backstop when the insert uses their JWT.
create policy analytics_events_insert_member
on public.analytics_events
for insert
to authenticated
with check (not (select private.is_admin()));

create policy analytics_events_select_admin
on public.analytics_events
for select
to authenticated
using ((select private.is_admin()));

-- Drop a burst without storing an IP. The insert is cancelled (return null)
-- so a flood does not raise into the page.
create or replace function private.analytics_reject_flood()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
  v_visitor integer;
begin
  select count(*) into v_recent
  from public.analytics_events
  where created_at > pg_catalog.now() - interval '1 minute';

  if v_recent >= 3000 then
    return null;
  end if;

  select count(*) into v_visitor
  from public.analytics_events
  where visitor_id = new.visitor_id
    and created_at > pg_catalog.now() - interval '1 minute';

  if v_visitor >= 60 then
    return null;
  end if;

  return new;
end;
$$;

revoke all on function private.analytics_reject_flood() from public, anon, authenticated;

comment on function private.analytics_reject_flood() is
  'Skips an analytics insert when the last minute is already very busy. Does not read or store an IP.';

create trigger analytics_events_reject_flood
before insert on public.analytics_events
for each row
execute function private.analytics_reject_flood();

-- Security invoker: RLS still applies. Raises unless the caller is an admin,
-- so a non-admin cannot mistake an empty read for "no traffic".
create or replace function public.analytics_dashboard(p_days integer)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_days integer := case when p_days = 30 then 30 else 7 end;
  v_today date := (pg_catalog.timezone('utc', pg_catalog.now()))::date;
  v_start date := v_today - (v_days - 1);
  v_from timestamptz := v_start::timestamp at time zone 'utc';
  v_to timestamptz := (v_today + 1)::timestamp at time zone 'utc';
  v_result jsonb;
begin
  if not (select private.is_admin()) then
    raise exception 'admin access required'
      using errcode = '42501';
  end if;

  with windowed as (
    select
      event,
      path,
      visitor_id,
      session_id,
      therapist_id,
      cta,
      (pg_catalog.timezone('utc', created_at))::date as day
    from public.analytics_events
    where created_at >= v_from
      and created_at < v_to
  ),
  page_views as (
    select * from windowed where event = 'page_view'
  ),
  trend as (
    select
      series.day::date as day,
      count(pv.visitor_id)::int as page_views,
      count(distinct pv.visitor_id)::int as visitors
    from pg_catalog.generate_series(v_start, v_today, interval '1 day') as series(day)
    left join page_views pv on pv.day = series.day::date
    group by series.day
  ),
  top_pages as (
    select path, count(*)::int as views
    from page_views
    group by path
    order by views desc, path asc
    limit 10
  ),
  therapists as (
    select
      w.therapist_id as id,
      coalesce(nullif(pg_catalog.btrim(p.name), ''), 'Removed profile') as name,
      count(*) filter (where w.event = 'card_click')::int as card_clicks,
      count(*) filter (where w.event = 'profile_view')::int as profile_views,
      count(*) filter (where w.event = 'cta_click' and w.cta = 'book')::int as book_clicks,
      count(*) filter (where w.event = 'cta_click' and w.cta = 'consult')::int as consult_clicks
    from windowed w
    left join public.profiles p on p.id = w.therapist_id
    where w.therapist_id is not null
      and w.event in ('card_click', 'profile_view', 'cta_click')
    group by w.therapist_id, p.name
    order by
      (
        count(*) filter (where w.event = 'profile_view')
        + count(*) filter (where w.event = 'card_click')
        + count(*) filter (where w.event = 'cta_click')
      ) desc,
      name asc
    limit 40
  )
  select pg_catalog.jsonb_build_object(
    'days', v_days,
    'page_views', (select count(*)::int from page_views),
    'visits', (select count(distinct session_id)::int from page_views),
    'unique_visitors', (select count(distinct visitor_id)::int from page_views),
    'top_pages', coalesce(
      (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object('path', path, 'views', views)
          order by views desc, path asc
        )
        from top_pages
      ),
      '[]'::jsonb
    ),
    'trend', coalesce(
      (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'day', day,
            'page_views', page_views,
            'visitors', visitors
          )
          order by day
        )
        from trend
      ),
      '[]'::jsonb
    ),
    'therapists', coalesce(
      (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'id', id,
            'name', name,
            'card_clicks', card_clicks,
            'profile_views', profile_views,
            'book_clicks', book_clicks,
            'consult_clicks', consult_clicks
          )
          order by (profile_views + card_clicks + book_clicks + consult_clicks) desc,
            name asc
        )
        from therapists
      ),
      '[]'::jsonb
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.analytics_dashboard(integer) from public, anon, authenticated;
grant execute on function public.analytics_dashboard(integer) to authenticated;

comment on function public.analytics_dashboard(integer) is
  'Admin-only totals for anonymous analytics. Security invoker, so RLS still hides rows. 7 or 30 UTC days. Does not return visitor ids.';
