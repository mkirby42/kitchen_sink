-- Join publish is public: listed true, open_to_new_clients from the form.
-- A normal therapist insert is always listed, even if a hold row was left behind.
-- An admin Join still restores therapist_listing_hold, so a profile that was
-- already unlisted stays unlisted. That is how Christine Lo and Matt Kirby
-- stay off Find after another admin Join. This file does not update those rows.

create or replace function private.guard_therapist_listed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listed boolean;
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is not null and not private.is_admin() then
      new.listed := true;
      delete from private.therapist_listing_hold h
      where h.profile_id = new.profile_id;
      return new;
    end if;

    select h.listed
    into v_listed
    from private.therapist_listing_hold h
    where h.profile_id = new.profile_id;

    if found then
      new.listed := v_listed;
      delete from private.therapist_listing_hold h
      where h.profile_id = new.profile_id;
    elsif new.listed is null then
      new.listed := true;
    end if;

    return new;
  end if;

  if new.listed is distinct from old.listed
     and (select auth.uid()) is not null
     and not private.is_admin() then
    raise exception 'Only an admin can change directory listing'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_therapist_listed()
  from public, anon, authenticated, service_role;

