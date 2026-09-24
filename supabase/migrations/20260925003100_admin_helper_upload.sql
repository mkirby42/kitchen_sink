-- Ops admin can upload a photo or intro video for an existing therapist.
-- Same buckets and prefixes as join: photos/{therapist_id}/ and videos/{therapist_id}/.
-- Admin is a profiles.role, not a JWT user_metadata claim. API sessions cannot self-assign it.

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'profiles'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%therapist%'
    and pg_get_constraintdef(con.oid) like '%patient%'
    and pg_get_constraintdef(con.oid) not like '%name%';

  if constraint_name is null then
    raise exception 'profiles role check constraint not found';
  end if;

  execute format('alter table public.profiles drop constraint %I', constraint_name);
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('therapist', 'patient', 'admin'));

comment on constraint profiles_role_check on public.profiles is
  'therapist and patient are product accounts. admin is ops helper-upload. Not self-assignable from the API.';

create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon, authenticated, service_role;
grant execute on function private.is_admin() to authenticated;

comment on function private.is_admin() is
  'True when the current user has profiles.role = admin. Security definer so profile policies can call it without RLS recursion.';

create or replace function private.reject_api_admin_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Dashboard SQL and migrations have no end-user JWT. Those may grant admin.
  if (select auth.uid()) is null then
    return new;
  end if;

  if tg_op = 'INSERT' and new.role = 'admin' then
    raise exception 'admin role cannot be self-assigned'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    raise exception 'profile role cannot be changed from the API'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_reject_api_admin_role on public.profiles;

create trigger profiles_reject_api_admin_role
before insert or update on public.profiles
for each row
execute function private.reject_api_admin_role();

create policy profiles_select_admin
on public.profiles
for select
to authenticated
using (
  (select private.is_admin())
  and role = 'therapist'
);

create policy therapists_select_admin
on public.therapists
for select
to authenticated
using ((select private.is_admin()));

create policy photos_videos_insert_admin
on storage.objects
for insert
to authenticated
with check (
  (select private.is_admin())
  and bucket_id in ('photos', 'videos')
  and exists (
    select 1
    from public.therapists t
    where t.profile_id::text = (storage.foldername(name))[1]
  )
);

create policy photos_videos_update_admin
on storage.objects
for update
to authenticated
using (
  (select private.is_admin())
  and bucket_id in ('photos', 'videos')
  and exists (
    select 1
    from public.therapists t
    where t.profile_id::text = (storage.foldername(name))[1]
  )
)
with check (
  (select private.is_admin())
  and bucket_id in ('photos', 'videos')
  and exists (
    select 1
    from public.therapists t
    where t.profile_id::text = (storage.foldername(name))[1]
  )
);

create or replace function private.admin_set_therapist_media(
  p_therapist_id uuid,
  p_kind text,
  p_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin access is required'
      using errcode = '42501';
  end if;

  if p_kind not in ('photo', 'video') then
    raise exception 'Media kind must be photo or video';
  end if;

  if p_therapist_id is null
     or p_key is null
     or split_part(p_key, '/', 1) <> p_therapist_id::text
     or split_part(p_key, '/', 2) = ''
     or split_part(p_key, '/', 3) <> ''
     or position('..' in p_key) > 0
     or position(chr(92) in p_key) > 0
  then
    raise exception 'Storage key must be one file under the therapist prefix';
  end if;

  if not exists (
    select 1
    from public.therapists t
    join public.profiles p on p.id = t.profile_id
    where t.profile_id = p_therapist_id
      and p.role = 'therapist'
  ) then
    raise exception 'Therapist profile not found';
  end if;

  if p_kind = 'photo' then
    update public.profiles
    set photo_key = p_key
    where id = p_therapist_id
      and role = 'therapist';
  else
    update public.profiles
    set video_key = p_key
    where id = p_therapist_id
      and role = 'therapist';
  end if;

  if not found then
    raise exception 'Therapist profile not found';
  end if;
end;
$$;

revoke all on function private.admin_set_therapist_media(uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function private.admin_set_therapist_media(uuid, text, text)
  to authenticated;

create or replace function public.admin_set_therapist_media(
  p_therapist_id uuid,
  p_kind text,
  p_key text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.admin_set_therapist_media(p_therapist_id, p_kind, p_key);
end;
$$;

revoke all on function public.admin_set_therapist_media(uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.admin_set_therapist_media(uuid, text, text)
  to authenticated;

comment on function public.admin_set_therapist_media(uuid, text, text) is
  'Admin sets photo_key or video_key for one therapist. Key must be a single object under that therapist id. Does not change other profile fields.';

-- Demo ops login so the helper page is exercisable. Christine is granted separately
-- (see docs/REQUIREMENTS.md); do not seed her personal password here.
do $$
declare
  ops uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  instance uuid := '00000000-0000-0000-0000-000000000000';
begin
  if not exists (select 1 from auth.users where id = ops) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
    )
    values (
      instance, ops, 'authenticated', 'authenticated',
      'ops@example.com',
      extensions.crypt('seed-only', extensions.gen_salt('bf')),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Kitchen Sink Ops"}'::jsonb,
      now(), now(), false, false
    );
  end if;

  if not exists (
    select 1 from auth.identities
    where user_id = ops and provider = 'email'
  ) then
    insert into auth.identities (
      user_id, identity_data, provider, provider_id, last_sign_in_at,
      created_at, updated_at
    )
    values (
      ops,
      jsonb_build_object('sub', ops::text, 'email', 'ops@example.com'),
      'email', ops::text, now(), now(), now()
    );
  end if;

  if not exists (select 1 from public.profiles where id = ops) then
    insert into public.profiles (id, role, name, email)
    values (ops, 'admin', 'Kitchen Sink Ops', 'ops@example.com');
  end if;
end $$;

notify pgrst, 'reload schema';
