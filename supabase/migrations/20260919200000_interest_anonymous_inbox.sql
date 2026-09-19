-- Patient interest in a therapist. Therapist inbox is aliases only.

create table public.interest (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id) on delete cascade,
  therapist_id uuid not null references public.therapists (profile_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (patient_id, therapist_id),
  check (patient_id <> therapist_id)
);

create index interest_therapist_created_idx
  on public.interest (therapist_id, created_at desc);

create index interest_patient_id_idx
  on public.interest (patient_id);

create or replace function public.interest_require_patient_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = new.patient_id
      and p.role = 'patient'
  ) then
    raise exception 'interest.patient_id must be a patient profile';
  end if;
  return new;
end;
$$;

create trigger interest_patient_role
before insert or update on public.interest
for each row
execute function public.interest_require_patient_role();

create or replace function public.interest_require_open_therapist()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.therapists t
    where t.profile_id = new.therapist_id
      and t.open_to_new_clients
  ) then
    raise exception 'therapist is not open to new clients';
  end if;
  return new;
end;
$$;

create trigger interest_open_therapist
before insert on public.interest
for each row
execute function public.interest_require_open_therapist();

alter table public.interest enable row level security;

create policy interest_select_own
on public.interest
for select
to authenticated
using (
  patient_id = (select auth.uid())
  or therapist_id = (select auth.uid())
);

create policy interest_insert_patient
on public.interest
for insert
to authenticated
with check (patient_id = (select auth.uid()));

create policy interest_delete_patient
on public.interest
for delete
to authenticated
using (patient_id = (select auth.uid()));

create or replace function public.interest_alias(p_patient_id uuid)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'Patient · ' || upper(right(replace(p_patient_id::text, '-', ''), 4));
$$;

create or replace function public.list_my_interest()
returns table (
  id uuid,
  alias text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    i.id,
    public.interest_alias(i.patient_id) as alias,
    i.created_at
  from public.interest i
  where i.therapist_id = (select auth.uid())
  order by i.created_at desc;
$$;

create or replace function public.ensure_patient_profile()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := (select auth.uid());
  v_role text;
begin
  if v_id is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  select p.role into v_role
  from public.profiles p
  where p.id = v_id;

  if v_role = 'therapist' then
    raise exception 'Therapists cannot express interest as a patient'
      using errcode = '42501';
  end if;

  if v_role = 'patient' then
    return v_id;
  end if;

  insert into public.profiles (id, role, name, email)
  values (
    v_id,
    'patient',
    'Patient',
    (select auth.jwt() ->> 'email')
  );

  return v_id;
end;
$$;

grant execute on function public.interest_alias(uuid) to anon, authenticated;
grant execute on function public.list_my_interest() to authenticated;
grant execute on function public.ensure_patient_profile() to authenticated;

insert into public.interest (patient_id, therapist_id)
values
  (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '11111111-1111-4111-8111-111111111111'
  )
on conflict (patient_id, therapist_id) do nothing;
