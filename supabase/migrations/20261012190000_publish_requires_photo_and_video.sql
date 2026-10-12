-- Publishing requires a photo and a short intro video.
-- A draft (published = false) may omit both.
-- Existing published rows are not rewritten. The next save that
-- leaves the profile published checks the keys already stored
-- on profiles (the save writes those keys first).

create or replace function private.require_publish_media()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.published is not true then
    return new;
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = new.profile_id
      and nullif(btrim(p.photo_key), '') is not null
      and nullif(btrim(p.video_key), '') is not null
  ) then
    raise exception 'A photo and a short intro video are required to publish'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function private.require_publish_media() is
  'Blocks insert or published-column updates that would leave a profile published without a photo and intro video. Drafts are allowed without either.';

revoke all on function private.require_publish_media()
  from public, anon, authenticated, service_role;

drop trigger if exists therapists_require_publish_media on public.therapists;

create trigger therapists_require_publish_media
before insert or update of published on public.therapists
for each row
execute function private.require_publish_media();
