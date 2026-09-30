-- Join "Feedback for us" is already stored on public.feedback.
-- notified_at claims a row for the ops email. A failed send clears it.
-- Rows that existed before this column are marked so they are not emailed later.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'feedback'
      and column_name = 'notified_at'
  ) then
    alter table public.feedback
      add column notified_at timestamptz;
    -- Existing notes were never emailed. Mark them so a later profile view
    -- does not send the backlog. Only rows inserted after this run qualify.
    update public.feedback
    set notified_at = now()
    where notified_at is null;
  end if;
end $$;

comment on column public.feedback.notified_at is
  'Set when this row is claimed for the ops feedback email. Cleared if that send fails.';

create or replace function public.claim_own_feedback_for_email(p_body text default null)
returns table (
  feedback_id uuid,
  feedback_body text,
  feedback_created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_feedback_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentication is required to email feedback'
      using errcode = '42501';
  end if;

  if p_body is not null and btrim(p_body) = '' then
    return;
  end if;

  select f.id
  into v_feedback_id
  from public.feedback f
  where f.profile_id = v_uid
    and f.notified_at is null
    and f.created_at > now() - interval '24 hours'
    and (p_body is null or btrim(f.body) = btrim(p_body))
  order by f.created_at desc
  limit 1
  for update;

  if v_feedback_id is null then
    return;
  end if;

  update public.feedback
  set notified_at = now()
  where id = v_feedback_id
    and profile_id = v_uid
    and notified_at is null;

  if not found then
    return;
  end if;

  return query
  select f.id, f.body, f.created_at
  from public.feedback f
  where f.id = v_feedback_id;
end;
$$;

revoke all on function public.claim_own_feedback_for_email(text)
  from public, anon, authenticated, service_role;
grant execute on function public.claim_own_feedback_for_email(text)
  to authenticated;

comment on function public.claim_own_feedback_for_email(text) is
  'Claims the signed-in therapist or admin''s fresh feedback row for one ops email. Pass the saved body, or null for the latest unsent row.';

create or replace function public.release_own_feedback_email_claim(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Authentication is required to release feedback'
      using errcode = '42501';
  end if;

  update public.feedback
  set notified_at = null
  where id = p_id
    and profile_id = v_uid;
end;
$$;

revoke all on function public.release_own_feedback_email_claim(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.release_own_feedback_email_claim(uuid)
  to authenticated;

comment on function public.release_own_feedback_email_claim(uuid) is
  'Clears the ops-email claim on the signed-in user''s feedback row after a failed send.';
