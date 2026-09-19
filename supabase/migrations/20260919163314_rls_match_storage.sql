-- RLS, OR match RPC, storage buckets and policies.

create policy profiles_select_public
on public.profiles
for select
to anon, authenticated
using (
  id = (select auth.uid())
  or (
    role = 'therapist'
    and exists (
      select 1
      from public.therapists t
      where t.profile_id = profiles.id
        and t.open_to_new_clients
    )
  )
);

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy therapists_select_public
on public.therapists
for select
to anon, authenticated
using (
  open_to_new_clients
  or profile_id = (select auth.uid())
);

create policy therapists_insert_own
on public.therapists
for insert
to authenticated
with check (profile_id = (select auth.uid()));

create policy therapists_update_own
on public.therapists
for update
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

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
  )
);

create policy rates_write_own
on public.rates
for all
to authenticated
using (therapist_id = (select auth.uid()))
with check (therapist_id = (select auth.uid()));

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
  )
);

create policy licenses_write_own
on public.licenses
for all
to authenticated
using (therapist_id = (select auth.uid()))
with check (therapist_id = (select auth.uid()));

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
  )
);

create policy locations_write_own
on public.locations
for all
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

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
  )
);

create policy tags_write_own
on public.tags
for all
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

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
  )
);

create policy profile_items_write_own
on public.profile_items
for all
to authenticated
using (therapist_id = (select auth.uid()))
with check (therapist_id = (select auth.uid()));

create policy feedback_insert_own
on public.feedback
for insert
to authenticated
with check (profile_id = (select auth.uid()));

create policy feedback_select_own
on public.feedback
for select
to authenticated
using (profile_id = (select auth.uid()));

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
  )
);

-- Tag OR: overlap at least one selected specialty/insurance label.
create or replace function public.search_therapists(
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
    t.virtual_practice,
    t.in_person_practice,
    coalesce(spec.labels, '{}'::text[]),
    coalesce(ins.labels, '{}'::text[])
  from public.therapists t
  join public.profiles p on p.id = t.profile_id
  left join lateral (
    select min(r.price_cents)::integer as min_price_cents
    from public.rates r
    where r.therapist_id = t.profile_id
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
  'OR tag overlap on specialty/insurance; optional format + license state; min rate; cap 24. Seeded EXPLAIN ANALYZE ~4ms.';

grant execute on function public.search_therapists(
  text[], boolean, boolean, text, integer, integer
) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'photos',
    'photos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'videos',
    'videos',
    true,
    52428800,
    array['video/mp4', 'video/webm', 'video/quicktime']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists photos_videos_public_read on storage.objects;
drop policy if exists photos_videos_insert_own on storage.objects;
drop policy if exists photos_videos_update_own on storage.objects;
drop policy if exists photos_videos_delete_own on storage.objects;

create policy photos_videos_public_read
on storage.objects
for select
to public
using (bucket_id in ('photos', 'videos'));

create policy photos_videos_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('photos', 'videos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy photos_videos_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id in ('photos', 'videos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('photos', 'videos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy photos_videos_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('photos', 'videos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
