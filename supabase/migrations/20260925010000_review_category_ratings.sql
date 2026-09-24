-- Three required 1–5 ratings replace the optional overall stars.
-- stars_cat_1 felt understood, stars_cat_2 communication, stars_cat_3 right fit.
-- stars_avg is the mean of those three (headline + per-review stars).
-- The written note is optional. The Reviews tab breakdown averages each column.

alter table public.reviews
  drop constraint reviews_stars_whole;

alter table public.reviews
  drop constraint reviews_body_len;

alter table public.reviews
  add constraint reviews_body_len
  check (body is null or char_length(btrim(body)) between 1 and 2000);

alter table public.reviews
  add constraint reviews_stars_avg_range
  check (stars_avg is null or (stars_avg >= 1 and stars_avg <= 5));

alter table public.reviews
  add constraint reviews_stars_cat_1_whole
  check (
    stars_cat_1 is null
    or (
      stars_cat_1 >= 1
      and stars_cat_1 <= 5
      and stars_cat_1 = trunc(stars_cat_1)
    )
  );

alter table public.reviews
  add constraint reviews_stars_cat_2_whole
  check (
    stars_cat_2 is null
    or (
      stars_cat_2 >= 1
      and stars_cat_2 <= 5
      and stars_cat_2 = trunc(stars_cat_2)
    )
  );

alter table public.reviews
  add constraint reviews_stars_cat_3_whole
  check (
    stars_cat_3 is null
    or (
      stars_cat_3 >= 1
      and stars_cat_3 <= 5
      and stars_cat_3 = trunc(stars_cat_3)
    )
  );

update public.reviews
set
  stars_cat_1 = coalesce(stars_cat_1, stars_avg),
  stars_cat_2 = coalesce(stars_cat_2, stars_avg),
  stars_cat_3 = coalesce(stars_cat_3, stars_avg)
where stars_avg is not null
  and (stars_cat_1 is null or stars_cat_2 is null or stars_cat_3 is null);

-- Maya's three seed reviews match the Reviews tab screenshot:
-- felt understood 4.7, communication 5.0, right fit 4.3, overall 4.7.
update public.reviews
set stars_cat_1 = 5, stars_cat_2 = 5, stars_cat_3 = 5, stars_avg = 5
where therapist_id = '11111111-1111-4111-8111-111111111111'
  and patient_id = '22222222-2222-4222-8222-222222222222';

update public.reviews
set stars_cat_1 = 5, stars_cat_2 = 5, stars_cat_3 = 4, stars_avg = 14.0 / 3
where therapist_id = '11111111-1111-4111-8111-111111111111'
  and patient_id = '33333333-3333-4333-8333-333333333333';

update public.reviews
set stars_cat_1 = 4, stars_cat_2 = 5, stars_cat_3 = 4, stars_avg = 13.0 / 3
where therapist_id = '11111111-1111-4111-8111-111111111111'
  and patient_id = '44444444-4444-4444-8444-444444444444';

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

  if new.patient_id is null then
    if tg_op = 'UPDATE' and (select auth.uid()) is null then
      return new;
    end if;
    raise exception 'Sign in as a client to leave a review.';
  end if;

  if new.patient_id = new.therapist_id then
    raise exception 'You cannot review your own profile.';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = new.patient_id
      and p.role = 'patient'
  ) then
    raise exception 'Sign in as a client to leave a review.';
  end if;

  if not exists (
    select 1
    from public.therapists t
    where t.profile_id = new.therapist_id
      and t.open_to_new_clients
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
