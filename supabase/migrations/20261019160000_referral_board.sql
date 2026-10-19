-- Referral board, therapist side.
-- Apply this file on the hosted database before /referrals or
-- /admin/referrals will work. No new env var. The refresh email uses
-- RESEND_API_KEY and RESEND_FROM. The sweep uses SUPABASE_SERVICE_ROLE_KEY,
-- already required for profile-start drafts. Without that key, Refresh on
-- My referrals still works; the email waits until the key is present.
--
-- A post stays off the board until an admin approves it, then for 7 days.
-- Kitchen Sink does not store a client's name, email, or phone.
-- poster_type, handle, and for_whom exist so a later client-posted referral
-- can be added without reshaping the row. This phase only inserts
-- poster_type = therapist.

create or replace function private.referral_age_ranges()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'Child, 0-5',
    'Child, 6-12',
    'Teen, 13-17',
    'Adult, 18-29',
    'Adult, 30s',
    'Adult, 40s',
    'Adult, 50s',
    'Adult, 60+'
  ]::text[];
$$;

create or replace function private.referral_focus_areas()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'Anxiety',
    'Depression',
    'Trauma & PTSD',
    'Couples & Relationships',
    'ADHD',
    'Grief & Loss',
    'Life Transitions',
    'Self Discovery',
    'Immigration'
  ]::text[];
$$;

create or replace function private.referral_payments()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'Aetna',
    'BCBS',
    'Cigna',
    'Optum',
    'Out-of-Network Superbill',
    'Private pay',
    'Sliding scale'
  ]::text[];
$$;

create or replace function private.referral_formats()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['telehealth', 'in_person']::text[];
$$;

create or replace function private.referral_timings()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['mornings', 'evenings']::text[];
$$;

create or replace function private.referral_areas()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'Central Austin',
    'North Austin',
    'South Austin',
    'East Austin',
    'West Austin',
    'Round Rock',
    'Cedar Park',
    'Pflugerville',
    'Greater Austin'
  ]::text[];
$$;

create or replace function private.referral_choice_ok(
  p_values text[],
  p_allowed text[],
  p_min integer,
  p_max integer
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_values is not null
    and cardinality(p_values) between p_min and p_max
    and p_values <@ p_allowed
    and cardinality(p_values) = (
      select count(distinct v)::integer
      from unnest(p_values) as u(v)
    );
$$;

revoke all on function private.referral_age_ranges() from public, anon, authenticated;
revoke all on function private.referral_focus_areas() from public, anon, authenticated;
revoke all on function private.referral_payments() from public, anon, authenticated;
revoke all on function private.referral_formats() from public, anon, authenticated;
revoke all on function private.referral_timings() from public, anon, authenticated;
revoke all on function private.referral_areas() from public, anon, authenticated;
revoke all on function private.referral_choice_ok(text[], text[], integer, integer)
  from public, anon, authenticated;

create table public.referral_posts (
  id uuid primary key default gen_random_uuid(),
  poster_type text not null,
  poster_id uuid not null references public.profiles (id) on delete cascade,
  handle text,
  for_whom text,
  status text not null default 'pending',
  age_range text not null,
  focus_areas text[] not null,
  payments text[] not null,
  formats text[] not null,
  area text,
  timings text[] not null,
  attested boolean not null,
  interest_count integer not null default 0,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  closes_at timestamptz,
  closed_at timestamptz,
  refresh_token uuid not null default gen_random_uuid(),
  refresh_prompted_at timestamptz,
  constraint referral_posts_poster_shape check (
    (
      poster_type = 'therapist'
      and handle is null
      and for_whom is null
    )
    or (
      poster_type = 'client'
      and handle is not null
      and for_whom in ('self', 'someone_else')
    )
  ),
  constraint referral_posts_handle_shape check (
    handle is null
    or (
      char_length(handle) between 3 and 32
      and handle ~ '^[a-z0-9_]+$'
    )
  ),
  constraint referral_posts_status_check check (
    status in ('pending', 'approved', 'rejected', 'closed', 'removed')
  ),
  constraint referral_posts_age_check check (
    age_range = any (private.referral_age_ranges())
  ),
  constraint referral_posts_focus_check check (
    private.referral_choice_ok(focus_areas, private.referral_focus_areas(), 1, 8)
  ),
  constraint referral_posts_payments_check check (
    private.referral_choice_ok(payments, private.referral_payments(), 1, 8)
  ),
  constraint referral_posts_formats_check check (
    private.referral_choice_ok(formats, private.referral_formats(), 1, 2)
  ),
  constraint referral_posts_timings_check check (
    private.referral_choice_ok(timings, private.referral_timings(), 1, 2)
  ),
  constraint referral_posts_area_check check (
    area is null or area = any (private.referral_areas())
  ),
  constraint referral_posts_area_format_check check (
    area is null or 'in_person' = any (formats)
  ),
  constraint referral_posts_attested_check check (attested),
  constraint referral_posts_live_window_check check (
    status <> 'approved' or closes_at is not null
  ),
  constraint referral_posts_interest_count_check check (interest_count >= 0)
);

comment on table public.referral_posts is
  'De-identified referral request. Therapist posts in this phase. Client posts (poster_type client, anonymous handle) are allowed by the row shape and are not inserted yet. No client name or contact info.';

comment on column public.referral_posts.handle is
  'Anonymous handle for a future client post. Null on a therapist post.';

comment on column public.referral_posts.for_whom is
  'Future client post: self or someone_else. Null on a therapist post.';

comment on column public.referral_posts.closes_at is
  'Set when an admin approves the post, to approval time plus 7 days. The board hides the row after that. Refresh moves it forward another 7 days.';

comment on column public.referral_posts.refresh_token is
  'Unlisted token for the poster''s refresh email. Rotates when they refresh.';

create unique index referral_posts_handle_idx
  on public.referral_posts (lower(handle))
  where handle is not null;

create index referral_posts_poster_idx
  on public.referral_posts (poster_id, created_at desc);

create index referral_posts_live_idx
  on public.referral_posts (closes_at)
  where status = 'approved';

create index referral_posts_refresh_due_idx
  on public.referral_posts (closes_at)
  where status = 'approved' and refresh_prompted_at is null;

create table public.referral_interests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.referral_posts (id) on delete cascade,
  therapist_id uuid not null references public.profiles (id) on delete cascade,
  note text,
  passed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint referral_interests_unique unique (post_id, therapist_id),
  constraint referral_interests_note_check check (
    note is null or char_length(note) between 1 and 280
  )
);

comment on table public.referral_interests is
  'A published therapist tapped interested. note and passed_at are for a later client response (a short fit note, or Not for me). This phase does not write them.';

create index referral_interests_therapist_idx
  on public.referral_interests (therapist_id, created_at desc);

create table public.referral_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.referral_posts (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  therapist_ids uuid[] not null,
  created_at timestamptz not null default now(),
  constraint referral_shares_ids_check check (
    cardinality(therapist_ids) between 1 and 12
  )
);

comment on table public.referral_shares is
  'Unguessable list of public profile ids a poster chose to send. The share page does not include the referral request.';

create index referral_shares_post_idx
  on public.referral_shares (post_id);

create or replace function private.has_published_profile()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.therapists t
    where t.profile_id = (select auth.uid())
      and t.published
  );
$$;

revoke all on function private.has_published_profile() from public, anon, authenticated;
grant execute on function private.has_published_profile() to authenticated;

comment on function private.has_published_profile() is
  'True when the signed-in account has a published therapist row. Listed and open-to-new-clients are not required. A published profile is a verified therapist for the referral board.';

alter table public.referral_posts enable row level security;
alter table public.referral_interests enable row level security;
alter table public.referral_shares enable row level security;

revoke all on table public.referral_posts from public, anon, authenticated;
revoke all on table public.referral_interests from public, anon, authenticated;
revoke all on table public.referral_shares from public, anon, authenticated;

-- Backstop if a later grant adds select. The app reads through the functions.
-- Do not grant select: refresh_token and poster_id stay off the board API.
create policy referral_posts_select
on public.referral_posts
for select
to authenticated
using (
  poster_id = (select auth.uid())
  or (select private.is_admin())
  or (
    (select private.has_published_profile())
    and status = 'approved'
    and closes_at > now()
  )
);

create policy referral_interests_select
on public.referral_interests
for select
to authenticated
using (
  therapist_id = (select auth.uid())
  or (select private.is_admin())
  or exists (
    select 1
    from public.referral_posts p
    where p.id = post_id
      and p.poster_id = (select auth.uid())
  )
);

create or replace function private.sync_referral_interest_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_post uuid;
begin
  v_post := coalesce(new.post_id, old.post_id);
  update public.referral_posts
  set interest_count = (
    select count(*)::integer
    from public.referral_interests
    where post_id = v_post
  )
  where id = v_post;
  return null;
end;
$$;

revoke all on function private.sync_referral_interest_count() from public, anon, authenticated;

drop trigger if exists referral_interests_count on public.referral_interests;

create trigger referral_interests_count
after insert or delete on public.referral_interests
for each row
execute function private.sync_referral_interest_count();

create or replace function public.create_referral_post(
  p_age_range text,
  p_focus_areas text[],
  p_payments text[],
  p_formats text[],
  p_area text,
  p_timings text[],
  p_attested boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_area text;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to post a referral.'
      using errcode = '42501';
  end if;

  if not private.has_published_profile() then
    raise exception 'A published therapist profile is required.'
      using errcode = '42501';
  end if;

  if p_attested is not true then
    raise exception 'Confirm the post has no identifying details.';
  end if;

  v_area := nullif(btrim(coalesce(p_area, '')), '');

  if p_age_range is null or not (p_age_range = any (private.referral_age_ranges())) then
    raise exception 'Choose an age range from the list.';
  end if;

  if not private.referral_choice_ok(
    p_focus_areas, private.referral_focus_areas(), 1, 8
  ) then
    raise exception 'Choose focus areas from the list.';
  end if;

  if not private.referral_choice_ok(
    p_payments, private.referral_payments(), 1, 8
  ) then
    raise exception 'Choose payment from the list.';
  end if;

  if not private.referral_choice_ok(
    p_formats, private.referral_formats(), 1, 2
  ) then
    raise exception 'Choose telehealth, in person, or both.';
  end if;

  if not private.referral_choice_ok(
    p_timings, private.referral_timings(), 1, 2
  ) then
    raise exception 'Choose mornings, evenings, or both.';
  end if;

  if v_area is not null and not (v_area = any (private.referral_areas())) then
    raise exception 'Choose an area from the list.';
  end if;

  if v_area is not null and not ('in_person' = any (p_formats)) then
    raise exception 'An area is only for in-person requests.';
  end if;

  insert into public.referral_posts (
    poster_type,
    poster_id,
    handle,
    for_whom,
    status,
    age_range,
    focus_areas,
    payments,
    formats,
    area,
    timings,
    attested
  )
  values (
    'therapist',
    (select auth.uid()),
    null,
    null,
    'pending',
    p_age_range,
    p_focus_areas,
    p_payments,
    p_formats,
    v_area,
    p_timings,
    true
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.referral_board()
returns table (
  id uuid,
  age_range text,
  focus_areas text[],
  payments text[],
  formats text[],
  area text,
  timings text[],
  interest_count integer,
  created_at timestamptz,
  closes_at timestamptz,
  viewer_interested boolean,
  viewer_is_poster boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_published_profile() then
    raise exception 'A published therapist profile is required.'
      using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.age_range,
    p.focus_areas,
    p.payments,
    p.formats,
    p.area,
    p.timings,
    p.interest_count,
    p.created_at,
    p.closes_at,
    exists (
      select 1
      from public.referral_interests i
      where i.post_id = p.id
        and i.therapist_id = (select auth.uid())
    ),
    p.poster_id = (select auth.uid())
  from public.referral_posts p
  where p.status = 'approved'
    and p.closes_at > now()
  order by p.created_at desc
  limit 100;
end;
$$;

create or replace function public.my_referrals()
returns table (
  id uuid,
  age_range text,
  focus_areas text[],
  payments text[],
  formats text[],
  area text,
  timings text[],
  status text,
  interest_count integer,
  created_at timestamptz,
  approved_at timestamptz,
  closes_at timestamptz,
  closed_at timestamptz,
  refresh_token uuid,
  poster_type text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to post a referral.'
      using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.age_range,
    p.focus_areas,
    p.payments,
    p.formats,
    p.area,
    p.timings,
    p.status,
    p.interest_count,
    p.created_at,
    p.approved_at,
    p.closes_at,
    p.closed_at,
    p.refresh_token,
    p.poster_type
  from public.referral_posts p
  where p.poster_id = (select auth.uid())
  order by p.created_at desc
  limit 100;
end;
$$;

create or replace function public.referral_for_poster(p_id uuid)
returns table (
  id uuid,
  age_range text,
  focus_areas text[],
  payments text[],
  formats text[],
  area text,
  timings text[],
  status text,
  interest_count integer,
  created_at timestamptz,
  closes_at timestamptz,
  poster_type text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to post a referral.'
      using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.age_range,
    p.focus_areas,
    p.payments,
    p.formats,
    p.area,
    p.timings,
    p.status,
    p.interest_count,
    p.created_at,
    p.closes_at,
    p.poster_type
  from public.referral_posts p
  where p.id = p_id
    and p.poster_id = (select auth.uid());
end;
$$;

create or replace function public.set_referral_interest(
  p_post_id uuid,
  p_interested boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_poster uuid;
begin
  if not private.has_published_profile() then
    raise exception 'A published therapist profile is required.'
      using errcode = '42501';
  end if;

  select p.poster_id into v_poster
  from public.referral_posts p
  where p.id = p_post_id;

  if v_poster is null then
    raise exception 'That referral is not open.'
      using errcode = '42501';
  end if;

  if v_poster = (select auth.uid()) then
    raise exception 'You can''t respond to your own referral.';
  end if;

  if not exists (
    select 1
    from public.referral_posts p
    where p.id = p_post_id
      and p.status = 'approved'
      and p.closes_at > now()
  ) then
    raise exception 'That referral is not open.'
      using errcode = '42501';
  end if;

  if p_interested then
    insert into public.referral_interests (post_id, therapist_id)
    values (p_post_id, (select auth.uid()))
    on conflict (post_id, therapist_id) do nothing;
  else
    delete from public.referral_interests
    where post_id = p_post_id
      and therapist_id = (select auth.uid());
  end if;
end;
$$;

create or replace function public.close_referral_post(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.referral_posts
  set status = 'closed',
      closed_at = now()
  where id = p_id
    and poster_id = (select auth.uid())
    and status = 'approved'
    and closes_at > now();

  if not found then
    raise exception 'That referral is not open.';
  end if;
end;
$$;

create or replace function public.refresh_referral_post(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  update public.referral_posts
  set status = 'approved',
      closes_at = now() + interval '7 days',
      closed_at = null,
      refresh_prompted_at = null,
      refresh_token = gen_random_uuid()
  where refresh_token = p_token
    and poster_id = (select auth.uid())
    and poster_type = 'therapist'
    and (
      (status = 'approved' and closes_at <= now())
      or status = 'closed'
    )
  returning id into v_id;

  if v_id is null then
    raise exception 'That referral can''t be refreshed.';
  end if;

  return v_id;
end;
$$;

create or replace function public.moderate_referral(p_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not private.is_admin() then
    raise exception 'Admin access is required.'
      using errcode = '42501';
  end if;

  if p_action = 'approve' then
    update public.referral_posts
    set status = 'approved',
        approved_at = now(),
        closes_at = now() + interval '7 days',
        closed_at = null
    where id = p_id
      and status = 'pending';
    get diagnostics v_count = row_count;
    if v_count = 0 then
      raise exception 'That referral is no longer pending.';
    end if;
    return;
  end if;

  if p_action = 'reject' then
    update public.referral_posts
    set status = 'rejected',
        closed_at = now()
    where id = p_id
      and status = 'pending';
    get diagnostics v_count = row_count;
    if v_count = 0 then
      raise exception 'That referral is no longer pending.';
    end if;
    return;
  end if;

  if p_action = 'remove' then
    update public.referral_posts
    set status = 'removed',
        closed_at = now()
    where id = p_id
      and status in ('pending', 'approved', 'closed');
    get diagnostics v_count = row_count;
    if v_count = 0 then
      raise exception 'That referral can''t be removed.';
    end if;
    return;
  end if;

  raise exception 'That referral can''t be removed.';
end;
$$;

create or replace function public.admin_referral_queue()
returns table (
  id uuid,
  poster_id uuid,
  poster_name text,
  poster_type text,
  age_range text,
  focus_areas text[],
  payments text[],
  formats text[],
  area text,
  timings text[],
  status text,
  interest_count integer,
  created_at timestamptz,
  closes_at timestamptz,
  closed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access is required.'
      using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.poster_id,
    pr.name,
    p.poster_type,
    p.age_range,
    p.focus_areas,
    p.payments,
    p.formats,
    p.area,
    p.timings,
    p.status,
    p.interest_count,
    p.created_at,
    p.closes_at,
    p.closed_at
  from public.referral_posts p
  join public.profiles pr on pr.id = p.poster_id
  where p.status in ('pending', 'approved', 'closed')
  order by
    case p.status when 'pending' then 0 when 'approved' then 1 else 2 end,
    p.created_at desc
  limit 200;
end;
$$;

create or replace function public.referral_interest_roster(p_post_id uuid)
returns table (
  therapist_id uuid,
  name text,
  credential text,
  specialty_labels text[],
  insurance_labels text[],
  virtual_practice boolean,
  in_person_practice boolean,
  sliding_scale boolean,
  listed boolean,
  published boolean,
  open_to_new_clients boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.referral_posts p
    where p.id = p_post_id
      and (
        p.poster_id = (select auth.uid())
        or (select private.is_admin())
      )
  ) then
    raise exception 'That referral is not available.'
      using errcode = '42501';
  end if;

  return query
  select
    i.therapist_id,
    pr.name,
    t.credential,
    coalesce(
      (
        select array_agg(tag.label order by tag.label)
        from public.tags tag
        where tag.profile_id = i.therapist_id
          and tag.kind = 'specialty'
      ),
      '{}'::text[]
    ),
    coalesce(
      (
        select array_agg(tag.label order by tag.label)
        from public.tags tag
        where tag.profile_id = i.therapist_id
          and tag.kind = 'insurance'
      ),
      '{}'::text[]
    ),
    t.virtual_practice,
    t.in_person_practice,
    t.sliding_scale,
    t.listed,
    t.published,
    t.open_to_new_clients
  from public.referral_interests i
  join public.profiles pr on pr.id = i.therapist_id
  join public.therapists t on t.profile_id = i.therapist_id
  where i.post_id = p_post_id
  order by i.created_at asc;
end;
$$;

create or replace function public.create_referral_share(
  p_post_id uuid,
  p_therapist_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_id uuid;
begin
  if not exists (
    select 1
    from public.referral_posts p
    where p.id = p_post_id
      and p.poster_id = (select auth.uid())
  ) then
    raise exception 'That referral is not available.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(picked.id order by picked.ord), '{}'::uuid[])
  into v_ids
  from (
    select t.id, min(t.ord) as ord
    from unnest(coalesce(p_therapist_ids, '{}'::uuid[])) with ordinality as t(id, ord)
    group by t.id
  ) as picked;

  if cardinality(v_ids) < 1 or cardinality(v_ids) > 12 then
    raise exception 'Pick at least one therapist.';
  end if;

  if exists (
    select 1
    from unnest(v_ids) as picked(id)
    where not exists (
      select 1
      from public.referral_interests i
      where i.post_id = p_post_id
        and i.therapist_id = picked.id
    )
  ) then
    raise exception 'Only interested therapists can be shared.';
  end if;

  insert into public.referral_shares (post_id, created_by, therapist_ids)
  values (p_post_id, (select auth.uid()), v_ids)
  returning id into v_id;

  return v_id;
end;
$$;

-- Know the id, get the profile ids. No list of every share. No request text.
create or replace function public.referral_share(p_id uuid)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select s.therapist_ids
  from public.referral_shares s
  where s.id = p_id;
$$;

create or replace function public.claim_referral_refresh_prompts()
returns table (
  post_id uuid,
  poster_id uuid,
  poster_email text,
  age_range text,
  refresh_token uuid,
  closes_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role' then
    raise exception 'Admin access is required.'
      using errcode = '42501';
  end if;

  return query
  with due as (
    select d.id
    from public.referral_posts d
    where d.poster_type = 'therapist'
      and d.status = 'approved'
      and d.closes_at <= now()
      and d.refresh_prompted_at is null
    order by d.closes_at
    limit 20
    for update skip locked
  ),
  claimed as (
    update public.referral_posts p
    set refresh_prompted_at = now()
    from due
    where p.id = due.id
    returning
      p.id,
      p.poster_id,
      p.age_range,
      p.refresh_token,
      p.closes_at
  )
  select
    claimed.id,
    claimed.poster_id,
    pr.email,
    claimed.age_range,
    claimed.refresh_token,
    claimed.closes_at
  from claimed
  join public.profiles pr on pr.id = claimed.poster_id;
end;
$$;

create or replace function public.release_referral_refresh_prompt(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role' then
    raise exception 'Admin access is required.'
      using errcode = '42501';
  end if;

  update public.referral_posts
  set refresh_prompted_at = null
  where id = p_id
    and status = 'approved'
    and closes_at <= now();
end;
$$;

revoke all on function public.create_referral_post(text, text[], text[], text[], text, text[], boolean)
  from public, anon, authenticated;
revoke all on function public.referral_board() from public, anon, authenticated;
revoke all on function public.my_referrals() from public, anon, authenticated;
revoke all on function public.referral_for_poster(uuid) from public, anon, authenticated;
revoke all on function public.set_referral_interest(uuid, boolean) from public, anon, authenticated;
revoke all on function public.close_referral_post(uuid) from public, anon, authenticated;
revoke all on function public.refresh_referral_post(uuid) from public, anon, authenticated;
revoke all on function public.moderate_referral(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_referral_queue() from public, anon, authenticated;
revoke all on function public.referral_interest_roster(uuid) from public, anon, authenticated;
revoke all on function public.create_referral_share(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.referral_share(uuid) from public, anon, authenticated;
revoke all on function public.claim_referral_refresh_prompts() from public, anon, authenticated;
revoke all on function public.release_referral_refresh_prompt(uuid) from public, anon, authenticated;

grant execute on function public.create_referral_post(text, text[], text[], text[], text, text[], boolean)
  to authenticated;
grant execute on function public.referral_board() to authenticated;
grant execute on function public.my_referrals() to authenticated;
grant execute on function public.referral_for_poster(uuid) to authenticated;
grant execute on function public.set_referral_interest(uuid, boolean) to authenticated;
grant execute on function public.close_referral_post(uuid) to authenticated;
grant execute on function public.refresh_referral_post(uuid) to authenticated;
grant execute on function public.moderate_referral(uuid, text) to authenticated;
grant execute on function public.admin_referral_queue() to authenticated;
grant execute on function public.referral_interest_roster(uuid) to authenticated;
grant execute on function public.create_referral_share(uuid, uuid[]) to authenticated;
grant execute on function public.referral_share(uuid) to anon, authenticated;
grant execute on function public.claim_referral_refresh_prompts() to service_role;
grant execute on function public.release_referral_refresh_prompt(uuid) to service_role;

comment on function public.referral_board() is
  'Live approved posts for a published therapist. Omits poster id and the refresh token. One round trip.';

comment on function public.referral_share(uuid) is
  'Public profile ids for one share link. Returns null when the id is unknown. Does not return the referral request.';
