-- Reviews stay pending until an admin approves them.
-- Reject and delete hard-delete the row. There is no rejected or deleted archive.
-- Reviews have no storage objects. Existing rows were already public, so they stay approved.
-- Keeps 20260925154000: an admin may author one review on another open, listed
-- therapist without changing role. That write still lands pending. Approving
-- someone else's row does not rewrite its text.

alter table public.reviews
  add column if not exists status text;

alter table public.reviews disable trigger reviews_guard;

update public.reviews
set status = 'approved'
where status is null;

alter table public.reviews enable trigger reviews_guard;

alter table public.reviews
  alter column status set default 'pending';

alter table public.reviews
  alter column status set not null;

alter table public.reviews drop constraint if exists reviews_status_check;

alter table public.reviews
  add constraint reviews_status_check
  check (status in ('pending', 'approved'));

comment on column public.reviews.status is
  'pending until an admin approves. Reject and delete remove the row. Rejected text is not kept.';

create index if not exists reviews_pending_created_at_idx
  on public.reviews (created_at)
  where status = 'pending';

create or replace function public.reviews_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.therapist_id := old.therapist_id;
    new.created_at := old.created_at;
    -- A signed-in user cannot reassign the review. auth.uid() is null when
    -- ON DELETE SET NULL clears patient_id, so account deletion still works.
    if (select auth.uid()) is not null then
      new.patient_id := old.patient_id;
    end if;
  elsif (select auth.uid()) is not null then
    new.patient_id := (select auth.uid());
    new.created_at := now();
  end if;

  -- No end-user JWT: dashboard SQL and account deletion. Do not force pending.
  if (select auth.uid()) is null then
    if new.status is null or new.status not in ('pending', 'approved') then
      if tg_op = 'UPDATE' then
        new.status := coalesce(old.status, 'approved');
      else
        new.status := 'approved';
      end if;
    end if;

    if new.patient_id is null then
      if tg_op = 'UPDATE' then
        return new;
      end if;
      raise exception 'Sign in as a client to leave a review.';
    end if;
  elsif (select private.is_admin()) and tg_op = 'UPDATE'
    and new.patient_id is distinct from (select auth.uid())
  then
    -- Approve someone else's review only. Content stays what they submitted.
    -- Reject is a DELETE. An admin editing their own review falls through
    -- and is forced back to pending.
    new.author_name := old.author_name;
    new.anonymous := old.anonymous;
    new.patient_hidden := old.patient_hidden;
    new.stars_cat_1 := old.stars_cat_1;
    new.stars_cat_2 := old.stars_cat_2;
    new.stars_cat_3 := old.stars_cat_3;
    new.stars_avg := old.stars_avg;
    new.body := old.body;
    new.session_format := old.session_format;
    new.duration_label := old.duration_label;
    if new.status is distinct from 'approved' then
      raise exception 'Approve the review, or reject it to delete it.';
    end if;
    return new;
  elsif (select private.is_admin()) and tg_op = 'UPDATE'
    and new.patient_id is not distinct from (select auth.uid())
    and new.status = 'approved'
    and new.body is not distinct from old.body
    and new.author_name is not distinct from old.author_name
    and new.anonymous is not distinct from old.anonymous
    and new.patient_hidden is not distinct from old.patient_hidden
    and new.stars_cat_1 is not distinct from old.stars_cat_1
    and new.stars_cat_2 is not distinct from old.stars_cat_2
    and new.stars_cat_3 is not distinct from old.stars_cat_3
  then
    -- Queue approve of the admin's own pending review. Text is unchanged.
    return new;
  else
    new.status := 'pending';
  end if;

  if new.patient_id = new.therapist_id then
    raise exception 'You cannot review your own profile.';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = new.patient_id
      and p.role in ('patient', 'admin')
  ) then
    raise exception 'Sign in as a client to leave a review.';
  end if;

  if not exists (
    select 1
    from public.therapists t
    where t.profile_id = new.therapist_id
      and t.open_to_new_clients
      and t.listed
  ) then
    raise exception 'This therapist is not open to new clients.';
  end if;

  new.body := nullif(btrim(coalesce(new.body, '')), '');
  if new.body is not null and char_length(new.body) > 2000 then
    raise exception 'Keep the review under 2000 characters.';
  end if;

  if new.anonymous then
    new.author_name := null;
  else
    new.author_name := nullif(btrim(coalesce(new.author_name, '')), '');
    if new.author_name is null or char_length(new.author_name) > 80 then
      raise exception 'Add a display name, or post anonymously.';
    end if;
  end if;

  if new.stars_cat_1 is null
    or new.stars_cat_2 is null
    or new.stars_cat_3 is null
    or new.stars_cat_1 < 1 or new.stars_cat_1 > 5 or new.stars_cat_1 <> trunc(new.stars_cat_1)
    or new.stars_cat_2 < 1 or new.stars_cat_2 > 5 or new.stars_cat_2 <> trunc(new.stars_cat_2)
    or new.stars_cat_3 < 1 or new.stars_cat_3 > 5 or new.stars_cat_3 <> trunc(new.stars_cat_3)
  then
    raise exception 'Rate all three questions from 1 to 5.';
  end if;

  new.stars_avg := (new.stars_cat_1 + new.stars_cat_2 + new.stars_cat_3) / 3;

  return new;
end;
$$;

revoke all on function public.reviews_guard() from public, anon;
grant execute on function public.reviews_guard() to authenticated;

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
  )
);

drop policy if exists reviews_select_own on public.reviews;

create policy reviews_select_own
on public.reviews
for select
to authenticated
using (patient_id = (select auth.uid()));

drop policy if exists reviews_select_admin on public.reviews;

create policy reviews_select_admin
on public.reviews
for select
to authenticated
using ((select private.is_admin()));

drop policy if exists reviews_update_admin on public.reviews;

create policy reviews_update_admin
on public.reviews
for update
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and status = 'approved'
);

drop policy if exists reviews_delete_admin on public.reviews;

create policy reviews_delete_admin
on public.reviews
for delete
to authenticated
using ((select private.is_admin()));

drop policy if exists reviews_insert_must_be_pending on public.reviews;

create policy reviews_insert_must_be_pending
on public.reviews
as restrictive
for insert
to authenticated
with check (status = 'pending');
