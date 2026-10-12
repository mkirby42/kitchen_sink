-- Rate service types were a fixed list. Therapists can type their own
-- label when none of Individual / Couples / Family / Group fits, and can
-- keep more than one custom label. Uniqueness stays one label per therapist
-- (case-insensitive).
--
-- Ordered after 20261012140000_therapist_published.sql. Does not change
-- the published flag, the search function, or the draft and publish
-- functions. Those still insert the label as given; the trigger below
-- normalizes it. The drop only removes check constraints whose definition
-- mentions service_type, so duration and price checks, and the policies
-- added with the published column, stay.

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
      and pg_get_constraintdef(con.oid) ilike '%service_type%'
  loop
    execute format('alter table public.rates drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.rates
  add constraint rates_service_type_label_check
  check (
    char_length(service_type) between 1 and 80
    and service_type = case lower(service_type)
      when 'individual' then 'Individual'
      when 'couples' then 'Couples'
      when 'family' then 'Family'
      when 'group' then 'Group'
      else regexp_replace(
        regexp_replace(service_type, '^[[:space:]]+|[[:space:]]+$', '', 'g'),
        '[[:space:]]+',
        ' ',
        'g'
      )
    end
  );

create unique index rates_therapist_service_type_ci
  on public.rates (therapist_id, lower(service_type));

comment on column public.rates.service_type is
  'Preset (Individual, Couples, Family, Group) or a therapist-written label. Trimmed, 1–80 characters, unique per therapist ignoring case.';

create or replace function public.normalize_rate_service_type()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  label text;
begin
  label := regexp_replace(
    regexp_replace(coalesce(new.service_type, ''), '^[[:space:]]+|[[:space:]]+$', '', 'g'),
    '[[:space:]]+',
    ' ',
    'g'
  );
  label := case lower(label)
    when 'individual' then 'Individual'
    when 'couples' then 'Couples'
    when 'family' then 'Family'
    when 'group' then 'Group'
    else label
  end;
  if char_length(label) < 1 or char_length(label) > 80 then
    raise exception 'Rate service type must be 1 to 80 characters'
      using errcode = '23514';
  end if;
  new.service_type := label;
  return new;
end;
$$;

drop trigger if exists rates_normalize_service_type on public.rates;

create trigger rates_normalize_service_type
before insert or update of service_type on public.rates
for each row
execute function public.normalize_rate_service_type();
