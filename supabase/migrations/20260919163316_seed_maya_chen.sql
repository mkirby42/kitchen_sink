-- Maya Chen + three seed reviewers from the prototype screenshots.

do $$
declare
  maya uuid := '11111111-1111-4111-8111-111111111111';
  jr uuid := '22222222-2222-4222-8222-222222222222';
  priya uuid := '33333333-3333-4333-8333-333333333333';
  dm uuid := '44444444-4444-4444-8444-444444444444';
  instance uuid := '00000000-0000-0000-0000-000000000000';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, raw_app_meta_data,
    raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
  )
  values
    (
      instance, maya, 'authenticated', 'authenticated',
      'maya@kitchensink.demo',
      extensions.crypt('seed-only', extensions.gen_salt('bf')),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Dr. Maya Chen"}'::jsonb,
      now(), now(), false, false
    ),
    (
      instance, jr, 'authenticated', 'authenticated',
      'jr@kitchensink.demo',
      extensions.crypt('seed-only', extensions.gen_salt('bf')),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"J. R."}'::jsonb,
      now(), now(), false, false
    ),
    (
      instance, priya, 'authenticated', 'authenticated',
      'priya@kitchensink.demo',
      extensions.crypt('seed-only', extensions.gen_salt('bf')),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Priya S."}'::jsonb,
      now(), now(), false, false
    ),
    (
      instance, dm, 'authenticated', 'authenticated',
      'dm@kitchensink.demo',
      extensions.crypt('seed-only', extensions.gen_salt('bf')),
      now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"D. M."}'::jsonb,
      now(), now(), false, false
    );

  insert into auth.identities (
    user_id, identity_data, provider, provider_id, last_sign_in_at,
    created_at, updated_at
  )
  values
    (
      maya,
      jsonb_build_object('sub', maya::text, 'email', 'maya@kitchensink.demo'),
      'email', maya::text, now(), now(), now()
    ),
    (
      jr,
      jsonb_build_object('sub', jr::text, 'email', 'jr@kitchensink.demo'),
      'email', jr::text, now(), now(), now()
    ),
    (
      priya,
      jsonb_build_object('sub', priya::text, 'email', 'priya@kitchensink.demo'),
      'email', priya::text, now(), now(), now()
    ),
    (
      dm,
      jsonb_build_object('sub', dm::text, 'email', 'dm@kitchensink.demo'),
      'email', dm::text, now(), now(), now()
    );

  insert into public.profiles (id, role, name, email, phone, about_me)
  values
    (
      maya, 'therapist', 'Dr. Maya Chen', 'maya@kitchensink.demo',
      '(415) 555-0199',
      $m$Maya works with adults navigating anxiety, big life transitions, and relationship patterns they can't quite name. Sessions are collaborative, warm, and grounded in CBT and EMDR — with plenty of room for the messy parts that don't fit a framework.$m$
    ),
    (jr, 'patient', 'J. R.', 'jr@kitchensink.demo', null, null),
    (priya, 'patient', 'Priya S.', 'priya@kitchensink.demo', null, null),
    (dm, 'patient', 'D. M.', 'dm@kitchensink.demo', null, null);

  insert into public.locations (profile_id, address, state, zip)
  values (maya, 'Oakland', 'CA', '94612');

  insert into public.therapists (
    profile_id, credential, start_date_of_practice, open_to_new_clients,
    virtual_practice, in_person_practice,
    sliding_scale_min_cents, sliding_scale_max_cents, superbill
  )
  values (
    maya, 'LMFT', date '2017-09-19', true, true, true,
    9000, 12000, true
  );

  insert into public.licenses (therapist_id, number, state)
  values (maya, 'MFC 112938', 'CA');

  insert into public.rates (therapist_id, service_type, duration_minutes, price_cents)
  values (maya, 'Individual', 50, 16500);

  insert into public.tags (profile_id, kind, label)
  values
    (maya, 'specialty', 'Anxiety'),
    (maya, 'specialty', 'Trauma & PTSD'),
    (maya, 'specialty', 'Life Transitions'),
    (maya, 'modality', 'CBT'),
    (maya, 'modality', 'EMDR'),
    (maya, 'insurance', 'Aetna'),
    (maya, 'insurance', 'BCBS'),
    (maya, 'insurance', 'Cigna'),
    (maya, 'insurance', 'Out-of-Network Superbill'),
    (maya, 'outreach', 'email'),
    (maya, 'outreach', 'phone'),
    (maya, 'outreach', 'text');

  insert into public.profile_items (therapist_id, prompt, answer, tag)
  values
    (
      maya,
      'my approach to therapy is...',
      $a$Curious, direct, and a little irreverent — we'll laugh sometimes, and we'll also go to the uncomfortable places, because that's where the good stuff lives.$a$,
      'approach'
    ),
    (
      maya,
      'a session with me feels like...',
      $a$Sitting with a friend who happens to have a clinical toolkit — grounded, unhurried, never a lecture.$a$,
      'session_vibe'
    ),
    (
      maya,
      'I specialize in unpacking...',
      $a$Anxiety, life transitions, and relationship patterns that keep repeating no matter how hard you try to outrun them.$a$,
      'specialty'
    );

  insert into public.reviews (
    therapist_id, patient_id, stars_avg, body, session_format, duration_label
  )
  values
    (
      maya, jr, 5,
      $r$Maya made it easy to actually show up to the hard conversations. Six months in and I finally feel like I'm unpacking instead of just carrying it all around.$r$,
      'Virtual', '8 months with Maya'
    ),
    (
      maya, priya, 5,
      $r$Booking was simple, the free consult sold me immediately, and every session since has felt worth the fee.$r$,
      'In-person', '3 months with Maya'
    ),
    (
      maya, dm, 4,
      $r$Great listener, very direct when I needed it. Scheduling around insurance took an extra step but support helped.$r$,
      'Virtual', '1 year with Maya'
    );
end;
$$;
