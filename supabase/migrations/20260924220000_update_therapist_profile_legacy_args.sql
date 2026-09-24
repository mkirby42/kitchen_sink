-- Save changes from clients built before qualifications landed calls
-- update_therapist_profile with p_supervisor_name / p_supervisor_license
-- and without p_qualifications. 20260924160000 dropped that overload, so
-- PostgREST returns PGRST202. Those columns are gone; accept the old
-- argument list, keep existing qualification rows, and forward.

create or replace function public.update_therapist_profile(
  p_name text,
  p_email text,
  p_phone text,
  p_about text,
  p_photo_key text,
  p_video_key text,
  p_credential text,
  p_start_date date,
  p_open_to_new_clients boolean,
  p_virtual boolean,
  p_in_person boolean,
  p_supervisor_name text,
  p_supervisor_license text,
  p_superbill boolean,
  p_licenses jsonb,
  p_rates jsonb,
  p_location jsonb,
  p_tags jsonb,
  p_items jsonb,
  p_feedback text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
  v_qualifications jsonb;
begin
  -- p_supervisor_name and p_supervisor_license are accepted so the
  -- pre-qualifications call matches. Those columns were dropped.
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'kind', q.kind,
        'label', q.label,
        'position', q.position
      )
      order by q.position, q.kind, q.label
    ),
    '[]'::jsonb
  )
  into v_qualifications
  from public.qualifications q
  where q.therapist_id = v_id;

  return public.update_therapist_profile(
    p_name => p_name,
    p_email => p_email,
    p_phone => p_phone,
    p_about => p_about,
    p_photo_key => p_photo_key,
    p_video_key => p_video_key,
    p_credential => p_credential,
    p_start_date => p_start_date,
    p_open_to_new_clients => p_open_to_new_clients,
    p_virtual => p_virtual,
    p_in_person => p_in_person,
    p_superbill => p_superbill,
    p_licenses => p_licenses,
    p_rates => p_rates,
    p_location => p_location,
    p_tags => p_tags,
    p_items => p_items,
    p_qualifications => v_qualifications,
    p_feedback => p_feedback
  );
end;
$$;

revoke execute on function public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, text, text, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, text
) from public, anon;

grant execute on function public.update_therapist_profile(
  text, text, text, text, text, text, text, date,
  boolean, boolean, boolean, text, text, boolean,
  jsonb, jsonb, jsonb, jsonb, jsonb, text
) to authenticated;

notify pgrst, 'reload schema';
