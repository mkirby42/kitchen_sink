-- Hosted-safe demo seed wipe. Run on the linked project:
--   supabase db query --linked -f supabase/migrations/20260925043000_finish_demo_profile_removal.sql
--
-- 20260925003000_remove_seed_demo_profiles.sql failed on hosted Supabase with
-- storage.protect_delete() (42501) because it DELETE'd storage.objects.
-- This file does not delete storage rows.
--
-- Delete rule (unchanged): auth.users.id AND lower(email) both match the seed
-- list from the seed migrations. Anything else is left in place.
-- Profiles cascade from auth.users. reject_demo_seed_email stays.
--
-- Storage: SET owner and owner_id to null for those ids and for object names
-- whose first path segment is a seed id. Bytes remain. Delete them with the
-- Storage API (service role), not SQL. This migration RAISE NOTICE's each
-- leftover object as bucket/name.

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

grant execute on function public.reject_demo_seed_email() to anon, authenticated, service_role;

drop trigger if exists profiles_reject_demo_seed_email on public.profiles;
create trigger profiles_reject_demo_seed_email
before insert or update of email on public.profiles
for each row
execute function public.reject_demo_seed_email();

do $$
declare
  seed_ids uuid[] := array[]::uuid[];
  known_ids uuid[] := array[]::uuid[];
  known_text text[] := array[]::text[];
  removed integer := 0;
  leftover record;
  obj record;
  fk record;
  has_owner boolean := false;
  has_owner_id boolean := false;
begin
  create temporary table _demo_seed_accounts (
    id uuid primary key,
    email text not null
  ) on commit drop;

  insert into _demo_seed_accounts (id, email)
  values
    ('11111111-1111-4111-8111-111111111111', 'maya@kitchensink.demo'),
    ('22222222-2222-4222-8222-222222222222', 'jr@kitchensink.demo'),
    ('33333333-3333-4333-8333-333333333333', 'priya@kitchensink.demo'),
    ('44444444-4444-4444-8444-444444444444', 'dm@kitchensink.demo'),
    ('55555555-5555-4555-8555-555555555001', 'jordan@kitchensink.demo'),
    ('55555555-5555-4555-8555-555555555002', 'amara@kitchensink.demo'),
    ('55555555-5555-4555-8555-555555555003', 'luis@kitchensink.demo'),
    ('55555555-5555-4555-8555-555555555004', 'elena@kitchensink.demo'),
    ('55555555-5555-4555-8555-555555555005', 'sam@kitchensink.demo'),
    ('55555555-5555-4555-8555-555555555006', 'noah@kitchensink.demo'),
    ('55555555-5555-4555-8555-555555555007', 'fatima@kitchensink.demo'),
    ('55555555-5555-4555-8555-555555555008', 'owen@kitchensink.demo'),
    ('55555555-5555-4555-8555-555555555009', 'mei@kitchensink.demo'),
    ('55555555-5555-4555-8555-555555555010', 'chris@kitchensink.demo');

  select
    coalesce(array_agg(id), array[]::uuid[]),
    coalesce(array_agg(id::text), array[]::text[])
  into known_ids, known_text
  from _demo_seed_accounts;

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

  if to_regclass('storage.objects') is not null then
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'storage' and table_name = 'objects' and column_name = 'owner'
    ) into has_owner;
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'storage' and table_name = 'objects' and column_name = 'owner_id'
    ) into has_owner_id;

    if has_owner and has_owner_id then
      execute
        'update storage.objects
         set owner = null, owner_id = null
         where owner = any ($1)
            or owner_id = any ($2)
            or split_part(name, ''/'', 1) = any ($2)'
        using known_ids, known_text;
    elsif has_owner then
      execute
        'update storage.objects
         set owner = null
         where owner = any ($1)
            or split_part(name, ''/'', 1) = any ($2)'
        using known_ids, known_text;
    elsif has_owner_id then
      execute
        'update storage.objects
         set owner_id = null
         where owner_id = any ($1)
            or split_part(name, ''/'', 1) = any ($1)'
        using known_text;
    end if;

    for obj in
      select o.bucket_id, o.name
      from storage.objects o
      where split_part(o.name, '/', 1) = any (known_text)
    loop
      raise notice 'demo object remains (delete with the Storage API, not SQL): %/%',
        obj.bucket_id, obj.name;
    end loop;
  end if;

  for fk in
    select
      n.nspname as schema_name,
      c.relname as table_name,
      a.attname as column_name,
      a.attnotnull as not_null
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a
      on a.attrelid = c.oid
     and a.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.confrelid = 'auth.users'::regclass
      and n.nspname = 'storage'
      and c.relkind = 'r'
      and cardinality(con.conkey) = 1
  loop
    if fk.not_null then
      raise exception
        'storage.%.% is NOT NULL and references auth.users; cannot detach demo seed owners',
        fk.table_name, fk.column_name;
    end if;
    execute format(
      'update %I.%I set %I = null where %I = any ($1)',
      fk.schema_name,
      fk.table_name,
      fk.column_name,
      fk.column_name
    )
    using known_ids;
  end loop;

  if cardinality(seed_ids) = 0 then
    raise notice 'no demo seed auth users matched id+email; nothing deleted';
    return;
  end if;

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
      and n.nspname in ('auth', 'public')
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
