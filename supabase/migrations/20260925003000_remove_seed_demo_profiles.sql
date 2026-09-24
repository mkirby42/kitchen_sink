-- Remove obvious demo/seed accounts from the hosted database.
--
-- A row is deleted only when BOTH are true:
--   1. auth.users.id is one of the UUIDs inserted by
--      20260919163316_seed_maya_chen.sql or
--      20260919184500_seed_demo_therapists.sql
--   2. lower(auth.users.email) equals that seed's email (@kitchensink.demo)
--
-- Not deleted:
--   * any other auth user (real signups, including ones created after the seeds)
--   * a seed UUID whose email was changed away from the seed address
--   * an @kitchensink.demo email on any other id
-- Those leftovers are reported with RAISE NOTICE and left in place.
--
-- Those two seed migrations still insert on a fresh migrate. This file sorts
-- after them, so the migrate finishes with the demo rows gone. Already-applied
-- seed files are not re-run by `supabase db push`. The trigger below rejects a
-- later replay of those inserts (profile id in the seed list, or a new
-- @kitchensink.demo email).

create or replace function public.reject_demo_seed_email()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  seed_ids uuid[] := array[
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    '33333333-3333-4333-8333-333333333333'::uuid,
    '44444444-4444-4444-8444-444444444444'::uuid,
    '55555555-5555-4555-8555-555555555001'::uuid,
    '55555555-5555-4555-8555-555555555002'::uuid,
    '55555555-5555-4555-8555-555555555003'::uuid,
    '55555555-5555-4555-8555-555555555004'::uuid,
    '55555555-5555-4555-8555-555555555005'::uuid,
    '55555555-5555-4555-8555-555555555006'::uuid,
    '55555555-5555-4555-8555-555555555007'::uuid,
    '55555555-5555-4555-8555-555555555008'::uuid,
    '55555555-5555-4555-8555-555555555009'::uuid,
    '55555555-5555-4555-8555-555555555010'::uuid
  ];
  new_domain text := split_part(lower(btrim(coalesce(new.email, ''))), '@', 2);
  old_domain text;
begin
  -- OLD is unassigned on INSERT; only read it while handling UPDATE.
  if tg_op = 'INSERT' and (new.id = any (seed_ids) or new_domain = 'kitchensink.demo') then
    raise exception 'demo seed profiles are not created on this database'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    old_domain := split_part(lower(btrim(coalesce(old.email, ''))), '@', 2);
    if new_domain = 'kitchensink.demo' and old_domain is distinct from 'kitchensink.demo' then
      raise exception 'cannot change a profile email to the demo seed domain'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

-- Invoker trigger: join writes profiles as `authenticated`.
grant execute on function public.reject_demo_seed_email() to anon, authenticated, service_role;

drop trigger if exists profiles_reject_demo_seed_email on public.profiles;
create trigger profiles_reject_demo_seed_email
before insert or update of email on public.profiles
for each row
execute function public.reject_demo_seed_email();

do $$
declare
  seed_ids uuid[] := array[]::uuid[];
  seed_text text[];
  removed integer := 0;
  leftover record;
  fk record;
begin
  create temporary table _demo_seed_accounts (
    id uuid primary key,
    email text not null
  ) on commit drop;

  insert into _demo_seed_accounts (id, email)
  values
    -- therapist: Dr. Maya Chen
    ('11111111-1111-4111-8111-111111111111', 'maya@kitchensink.demo'),
    -- patients: seed reviewers only (J. R., Priya S., D. M.)
    ('22222222-2222-4222-8222-222222222222', 'jr@kitchensink.demo'),
    ('33333333-3333-4333-8333-333333333333', 'priya@kitchensink.demo'),
    ('44444444-4444-4444-8444-444444444444', 'dm@kitchensink.demo'),
    -- therapists from 20260919184500_seed_demo_therapists.sql
    ('55555555-5555-4555-8555-555555555001', 'jordan@kitchensink.demo'), -- Jordan Hale
    ('55555555-5555-4555-8555-555555555002', 'amara@kitchensink.demo'),  -- Amara Okonkwo
    ('55555555-5555-4555-8555-555555555003', 'luis@kitchensink.demo'),   -- Luis Ortega
    ('55555555-5555-4555-8555-555555555004', 'elena@kitchensink.demo'),  -- Elena Vasquez
    ('55555555-5555-4555-8555-555555555005', 'sam@kitchensink.demo'),    -- Sam Rivera
    ('55555555-5555-4555-8555-555555555006', 'noah@kitchensink.demo'),   -- Noah Kim
    ('55555555-5555-4555-8555-555555555007', 'fatima@kitchensink.demo'), -- Fatima Rahman
    ('55555555-5555-4555-8555-555555555008', 'owen@kitchensink.demo'),   -- Owen Blake
    ('55555555-5555-4555-8555-555555555009', 'mei@kitchensink.demo'),    -- Mei Lin
    ('55555555-5555-4555-8555-555555555010', 'chris@kitchensink.demo');  -- Chris Adeyemi

  select coalesce(array_agg(u.id), array[]::uuid[])
  into seed_ids
  from auth.users u
  join _demo_seed_accounts s
    on s.id = u.id
   and lower(u.email) = s.email;

  for leftover in
    select u.id, u.email::text as email
    from auth.users u
    where (
      u.id in (select id from _demo_seed_accounts)
      or lower(u.email) in (select email from _demo_seed_accounts)
    )
    and not (u.id = any (seed_ids))
  loop
    raise notice 'demo seed removal left auth user % (%) in place; id and email did not both match the seed list',
      leftover.id, leftover.email;
  end loop;

  if cardinality(seed_ids) = 0 then
    raise notice 'no demo seed auth users matched id+email; nothing deleted';
    return;
  end if;

  select coalesce(array_agg(id::text), array[]::text[])
  into seed_text
  from unnest(seed_ids) as id;

  -- Storage ownership blocks auth.users deletes. Seed media lives at
  -- {uuid}/photo.jpg and {uuid}/intro.mp4.
  if to_regclass('storage.objects') is not null then
    delete from storage.objects
    where split_part(name, '/', 1) = any (seed_text);

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'storage'
        and table_name = 'objects'
        and column_name = 'owner'
    ) then
      execute
        'delete from storage.objects where owner = any ($1)'
        using seed_ids;
    end if;
  end if;

  -- Non-cascade FKs to auth.users (storage.objects.owner on some projects).
  -- Cascade / set-null children are left for the auth.users delete.
  for fk in
    select
      n.nspname as schema_name,
      c.relname as table_name,
      a.attname as column_name
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a
      on a.attrelid = c.oid
     and a.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.confrelid = 'auth.users'::regclass
      and n.nspname in ('auth', 'storage', 'public')
      and c.relkind = 'r'
      and cardinality(con.conkey) = 1
      and con.confdeltype in ('a', 'r')
  loop
    execute format(
      'delete from %I.%I where %I = any ($1)',
      fk.schema_name,
      fk.table_name,
      fk.column_name
    )
    using seed_ids;
  end loop;

  delete from auth.users u
  using _demo_seed_accounts s
  where u.id = s.id
    and u.id = any (seed_ids)
    and lower(u.email) = s.email;

  get diagnostics removed = row_count;
  raise notice 'removed % demo seed auth users (id + email match)', removed;
end;
$$;
