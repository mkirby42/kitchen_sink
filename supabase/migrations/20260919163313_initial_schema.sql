-- Kitchen Sink tables, indexes, deferred min-row triggers, RLS enabled.

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('therapist', 'patient')),
  name text not null,
  email text,
  phone text,
  about_me text,
  photo_key text,
  video_key text,
  created_at timestamptz not null default now()
);

create table public.therapists (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  credential text,
  start_date_of_practice date,
  open_to_new_clients boolean not null default true,
  virtual_practice boolean not null default false,
  in_person_practice boolean not null default false,
  supervisor_name text,
  supervisor_license text,
  sliding_scale_min_cents integer,
  sliding_scale_max_cents integer,
  superbill boolean not null default false
);

create table public.rates (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists (profile_id) on delete cascade,
  service_type text not null check (
    service_type in ('Individual', 'Couples', 'Family', 'Group')
  ),
  duration_minutes integer not null check (
    duration_minutes in (30, 45, 50, 60, 90)
  ),
  price_cents integer not null check (price_cents >= 0),
  unique (therapist_id, service_type)
);

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists (profile_id) on delete cascade,
  number text not null,
  state text not null,
  unique (therapist_id, state)
);

create table public.locations (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  lat double precision,
  lon double precision,
  address text,
  address2 text,
  state text,
  zip text
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (
    kind in ('specialty', 'modality', 'identity', 'insurance', 'outreach')
  ),
  label text not null,
  unique (profile_id, kind, label)
);

create table public.profile_items (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists (profile_id) on delete cascade,
  prompt text not null,
  answer text not null,
  tag text not null check (
    tag in ('approach', 'session_vibe', 'specialty', 'about', 'outcome', 'custom')
  )
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists (profile_id) on delete cascade,
  patient_id uuid references public.profiles (id) on delete set null,
  patient_hidden boolean not null default false,
  stars_avg numeric,
  stars_cat_1 numeric,
  stars_cat_2 numeric,
  stars_cat_3 numeric,
  body text,
  session_format text,
  duration_label text,
  created_at timestamptz not null default now()
);

create index tags_kind_label_profile_idx
  on public.tags (kind, label, profile_id);

create index licenses_state_idx
  on public.licenses (state);

create index therapists_open_to_new_clients_idx
  on public.therapists (profile_id)
  where open_to_new_clients;

create index profile_items_therapist_id_idx
  on public.profile_items (therapist_id);

create index reviews_therapist_id_idx
  on public.reviews (therapist_id);

create index reviews_patient_id_idx
  on public.reviews (patient_id);

create index feedback_profile_id_idx
  on public.feedback (profile_id);

-- unique (therapist_id, service_type) / unique (therapist_id, state) cover those FKs.

create or replace function public.therapists_require_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.in_person_practice
     and not exists (
       select 1 from public.locations l where l.profile_id = new.profile_id
     )
  then
    raise exception 'in_person_practice requires a locations row';
  end if;
  return new;
end;
$$;

create or replace function public.therapists_require_license_and_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.licenses l where l.therapist_id = new.profile_id
  ) then
    raise exception 'therapist requires at least one license';
  end if;
  if not exists (
    select 1 from public.rates r where r.therapist_id = new.profile_id
  ) then
    raise exception 'therapist requires at least one rate';
  end if;
  return new;
end;
$$;

create constraint trigger therapists_in_person_location
after insert or update on public.therapists
deferrable initially deferred
for each row
execute function public.therapists_require_location();

create constraint trigger therapists_license_and_rate
after insert or update on public.therapists
deferrable initially deferred
for each row
execute function public.therapists_require_license_and_rate();

alter table public.profiles enable row level security;
alter table public.therapists enable row level security;
alter table public.rates enable row level security;
alter table public.licenses enable row level security;
alter table public.locations enable row level security;
alter table public.tags enable row level security;
alter table public.profile_items enable row level security;
alter table public.feedback enable row level security;
alter table public.reviews enable row level security;
