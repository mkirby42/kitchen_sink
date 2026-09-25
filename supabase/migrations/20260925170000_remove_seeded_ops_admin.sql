-- Remove the seeded ops admin if a previous apply of
-- 20260925003100_admin_helper_upload.sql left it in place.
--
-- Delete rule: auth.users.id AND lower(email) both match the seed.
-- A user who shares only the id or only the email stays.
-- Profiles cascade from auth.users. A leftover profile with that same
-- id and email is demoted from admin to patient.
-- Storage object rows are not deleted (hosted storage.protect_delete).
-- Ownership for this id is cleared; bytes go away through the Storage API.
--
-- Create a real admin in the Dashboard, then grant role = admin with SQL.
-- Never commit a password.

create or replace function public.reject_seeded_ops_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (
    new.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid
    or lower(btrim(coalesce(new.email, ''))) = 'ops@example.com'
  ) then
    raise exception 'seeded ops admin is not created on this database'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

grant execute on function public.reject_seeded_ops_admin() to anon, authenticated, service_role;

drop trigger if exists profiles_reject_seeded_ops_admin on public.profiles;
create trigger profiles_reject_seeded_ops_admin
before insert on public.profiles
for each row
execute function public.reject_seeded_ops_admin();

do $$
declare
  ops_id uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  ops_email text := 'ops@example.com';
  ops_ids uuid[] := array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid];
  ops_text text[] := array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'];
  matched boolean := false;
  removed integer := 0;
  demoted integer := 0;
  leftover record;
  obj record;
  fk record;
  has_owner boolean := false;
  has_owner_id boolean := false;
begin
  select exists (
    select 1
    from auth.users u
    where u.id = ops_id
      and lower(u.email) = ops_email
  )
  into matched;

  for leftover in
    select u.id, u.email::text as email
    from auth.users u
    where u.id = ops_id
       or lower(u.email) = ops_email
  loop
    if leftover.id is distinct from ops_id or lower(leftover.email) is distinct from ops_email then
      raise notice
        'seeded ops removal left auth user % (%) in place; id and email did not both match',
        leftover.id, leftover.email;
    end if;
  end loop;

  if matched then
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
          using ops_ids, ops_text;
      elsif has_owner then
        execute
          'update storage.objects
           set owner = null
           where owner = any ($1)
              or split_part(name, ''/'', 1) = any ($2)'
          using ops_ids, ops_text;
      elsif has_owner_id then
        execute
          'update storage.objects
           set owner_id = null
           where owner_id = any ($1)
              or split_part(name, ''/'', 1) = any ($1)'
          using ops_text;
      end if;

      for obj in
        select o.bucket_id, o.name
        from storage.objects o
        where split_part(o.name, '/', 1) = any (ops_text)
      loop
        raise notice
          'ops seed object remains (delete with the Storage API, not SQL): %/%',
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
          'storage.%.% is NOT NULL and references auth.users; cannot detach seeded ops owner',
          fk.table_name, fk.column_name;
      end if;
      execute format(
        'update %I.%I set %I = null where %I = any ($1)',
        fk.schema_name,
        fk.table_name,
        fk.column_name,
        fk.column_name
      )
      using ops_ids;
    end loop;

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
      using ops_ids;
    end loop;

    delete from auth.users u
    where u.id = ops_id
      and lower(u.email) = ops_email;

    get diagnostics removed = row_count;
    if removed <> 1 then
      raise exception
        'seeded ops auth user matched id+email but delete removed % rows',
        removed;
    end if;
    raise notice 'removed seeded ops auth user (id + email match)';
  else
    raise notice 'no seeded ops auth user matched id+email; nothing deleted';
  end if;

  update public.profiles
  set role = 'patient'
  where id = ops_id
    and lower(email) = ops_email
    and role = 'admin';

  get diagnostics demoted = row_count;
  if demoted > 0 then
    raise notice
      'demoted seeded ops profile from admin; auth user was not removed with it';
  end if;
end $$;
