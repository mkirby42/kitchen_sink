-- Conversation cards are 3–6 rows per therapist. Deferred so join/update
-- can delete the old set and insert the new one in one transaction.

create or replace function public.enforce_conversation_card_count()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_therapist uuid := coalesce(new.therapist_id, old.therapist_id);
  v_count integer;
begin
  -- Cascade deletes (auth user → profile → therapist → cards) leave no therapist.
  if not exists (
    select 1
    from public.therapists t
    where t.profile_id = v_therapist
  ) then
    return null;
  end if;

  select count(*)
  into v_count
  from public.profile_items
  where therapist_id = v_therapist;

  if v_count < 3 or v_count > 6 then
    raise exception 'conversation cards must be between 3 and 6'
      using errcode = '23514';
  end if;

  return null;
end;
$$;

drop trigger if exists profile_items_card_count on public.profile_items;

create constraint trigger profile_items_card_count
after insert or update or delete on public.profile_items
deferrable initially deferred
for each row
execute function public.enforce_conversation_card_count();
