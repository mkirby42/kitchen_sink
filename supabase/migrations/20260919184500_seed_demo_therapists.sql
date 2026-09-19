-- Maya media keys + 10 more open therapists so search can show multiple matches.

do $$
declare
  maya uuid := '11111111-1111-4111-8111-111111111111';
  jordan uuid := '55555555-5555-4555-8555-555555555001';
  amara uuid := '55555555-5555-4555-8555-555555555002';
  luis uuid := '55555555-5555-4555-8555-555555555003';
  elena uuid := '55555555-5555-4555-8555-555555555004';
  sam uuid := '55555555-5555-4555-8555-555555555005';
  noah uuid := '55555555-5555-4555-8555-555555555006';
  fatima uuid := '55555555-5555-4555-8555-555555555007';
  owen uuid := '55555555-5555-4555-8555-555555555008';
  mei uuid := '55555555-5555-4555-8555-555555555009';
  chris uuid := '55555555-5555-4555-8555-555555555010';
  jr uuid := '22222222-2222-4222-8222-222222222222';
  priya uuid := '33333333-3333-4333-8333-333333333333';
  dm uuid := '44444444-4444-4444-8444-444444444444';
  instance uuid := '00000000-0000-0000-0000-000000000000';
begin
  update public.profiles
  set
    photo_key = maya::text || '/photo.jpg',
    video_key = maya::text || '/intro.mp4'
  where id = maya;

  if exists (select 1 from public.profiles where id = jordan) then
    update public.profiles
    set
      photo_key = id::text || '/photo.jpg',
      video_key = id::text || '/intro.mp4'
    where id in (jordan, amara, luis, elena, sam, noah, fatima, owen, mei, chris);
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, raw_app_meta_data,
    raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
  )
  values
    (instance, jordan, 'authenticated', 'authenticated', 'jordan@kitchensink.demo', extensions.crypt('seed-only', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Jordan Hale"}'::jsonb, now(), now(), false, false),
    (instance, amara, 'authenticated', 'authenticated', 'amara@kitchensink.demo', extensions.crypt('seed-only', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Amara Okonkwo"}'::jsonb, now(), now(), false, false),
    (instance, luis, 'authenticated', 'authenticated', 'luis@kitchensink.demo', extensions.crypt('seed-only', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Luis Ortega"}'::jsonb, now(), now(), false, false),
    (instance, elena, 'authenticated', 'authenticated', 'elena@kitchensink.demo', extensions.crypt('seed-only', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Elena Vasquez"}'::jsonb, now(), now(), false, false),
    (instance, sam, 'authenticated', 'authenticated', 'sam@kitchensink.demo', extensions.crypt('seed-only', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Sam Rivera"}'::jsonb, now(), now(), false, false),
    (instance, noah, 'authenticated', 'authenticated', 'noah@kitchensink.demo', extensions.crypt('seed-only', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Noah Kim"}'::jsonb, now(), now(), false, false),
    (instance, fatima, 'authenticated', 'authenticated', 'fatima@kitchensink.demo', extensions.crypt('seed-only', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Fatima Rahman"}'::jsonb, now(), now(), false, false),
    (instance, owen, 'authenticated', 'authenticated', 'owen@kitchensink.demo', extensions.crypt('seed-only', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Owen Blake"}'::jsonb, now(), now(), false, false),
    (instance, mei, 'authenticated', 'authenticated', 'mei@kitchensink.demo', extensions.crypt('seed-only', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Mei Lin"}'::jsonb, now(), now(), false, false),
    (instance, chris, 'authenticated', 'authenticated', 'chris@kitchensink.demo', extensions.crypt('seed-only', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Chris Adeyemi"}'::jsonb, now(), now(), false, false);

  insert into auth.identities (
    user_id, identity_data, provider, provider_id, last_sign_in_at,
    created_at, updated_at
  )
  values
    (jordan, jsonb_build_object('sub', jordan::text, 'email', 'jordan@kitchensink.demo'), 'email', jordan::text, now(), now(), now()),
    (amara, jsonb_build_object('sub', amara::text, 'email', 'amara@kitchensink.demo'), 'email', amara::text, now(), now(), now()),
    (luis, jsonb_build_object('sub', luis::text, 'email', 'luis@kitchensink.demo'), 'email', luis::text, now(), now(), now()),
    (elena, jsonb_build_object('sub', elena::text, 'email', 'elena@kitchensink.demo'), 'email', elena::text, now(), now(), now()),
    (sam, jsonb_build_object('sub', sam::text, 'email', 'sam@kitchensink.demo'), 'email', sam::text, now(), now(), now()),
    (noah, jsonb_build_object('sub', noah::text, 'email', 'noah@kitchensink.demo'), 'email', noah::text, now(), now(), now()),
    (fatima, jsonb_build_object('sub', fatima::text, 'email', 'fatima@kitchensink.demo'), 'email', fatima::text, now(), now(), now()),
    (owen, jsonb_build_object('sub', owen::text, 'email', 'owen@kitchensink.demo'), 'email', owen::text, now(), now(), now()),
    (mei, jsonb_build_object('sub', mei::text, 'email', 'mei@kitchensink.demo'), 'email', mei::text, now(), now(), now()),
    (chris, jsonb_build_object('sub', chris::text, 'email', 'chris@kitchensink.demo'), 'email', chris::text, now(), now(), now());

  insert into public.profiles (id, role, name, email, phone, about_me, photo_key, video_key)
  values
    (
      jordan, 'therapist', 'Jordan Hale', 'jordan@kitchensink.demo', '(510) 555-0142',
      $a$Jordan helps adults who are tired of managing anxiety by shrinking their lives. Sessions are practical, collaborative, and a little wry — CBT and ACT tools without the homework pile-on.$a$,
      jordan::text || '/photo.jpg', jordan::text || '/intro.mp4'
    ),
    (
      amara, 'therapist', 'Amara Okonkwo', 'amara@kitchensink.demo', '(718) 555-0166',
      $a$Amara works with people carrying trauma and grief that never got a full room to land. EMDR and somatic work, paced so the nervous system can actually keep up.$a$,
      amara::text || '/photo.jpg', amara::text || '/intro.mp4'
    ),
    (
      luis, 'therapist', 'Luis Ortega', 'luis@kitchensink.demo', '(713) 555-0174',
      $a$Luis sees couples and individuals stuck in the same fight with new costumes. In-person, unhurried, and more interested in the pattern than who started it.$a$,
      luis::text || '/photo.jpg', luis::text || '/intro.mp4'
    ),
    (
      elena, 'therapist', 'Elena Vasquez', 'elena@kitchensink.demo', '(408) 555-0138',
      $a$Elena works with teens and the adults raising them — anxiety, ADHD, and the school-year spiral. DBT skills, straight talk, no talking-down.$a$,
      elena::text || '/photo.jpg', elena::text || '/intro.mp4'
    ),
    (
      sam, 'therapist', 'Sam Rivera', 'sam@kitchensink.demo', '(415) 555-0117',
      $a$Sam is an associate therapist who likes the in-between seasons: after a breakup, a move, a coming-out, a job that stopped making sense. Supervised, thoughtful, not in a rush to fix you.$a$,
      sam::text || '/photo.jpg', sam::text || '/intro.mp4'
    ),
    (
      noah, 'therapist', 'Noah Kim', 'noah@kitchensink.demo', '(206) 555-0188',
      $a$Noah helps adults with ADHD and the life-admin fog that comes with it. Sessions are structured enough to be useful and loose enough that you can still be a person.$a$,
      noah::text || '/photo.jpg', noah::text || '/intro.mp4'
    ),
    (
      fatima, 'therapist', 'Fatima Rahman', 'fatima@kitchensink.demo', '(312) 555-0194',
      $a$Fatima works with immigrants and first-generation adults holding family duty, documentation stress, and the quieter trauma that doesn't get a neat label.$a$,
      fatima::text || '/photo.jpg', fatima::text || '/intro.mp4'
    ),
    (
      owen, 'therapist', 'Owen Blake', 'owen@kitchensink.demo', '(303) 555-0129',
      $a$Owen sits with grief that other people are ready for you to be over. Veterans, caregivers, anyone who got good at functioning and worse at feeling.$a$,
      owen::text || '/photo.jpg', owen::text || '/intro.mp4'
    ),
    (
      mei, 'therapist', 'Mei Lin', 'mei@kitchensink.demo', '(415) 555-0155',
      $a$Mei works with couples and adults in transition — the move, the almost-divorce, the family role you never asked for. Attachment-focused, culturally fluent, not precious.$a$,
      mei::text || '/photo.jpg', mei::text || '/intro.mp4'
    ),
    (
      chris, 'therapist', 'Chris Adeyemi', 'chris@kitchensink.demo', '(404) 555-0161',
      $a$Chris is a psychiatrist who still likes doing therapy. Depression, trauma, and ADHD — medication when it helps, conversation either way.$a$,
      chris::text || '/photo.jpg', chris::text || '/intro.mp4'
    );

  insert into public.locations (profile_id, address, state, zip)
  values
    (amara, 'Brooklyn', 'NY', '11201'),
    (luis, 'Houston', 'TX', '77006'),
    (noah, 'Seattle', 'WA', '98101'),
    (owen, 'Denver', 'CO', '80203'),
    (mei, 'San Francisco', 'CA', '94110');

  insert into public.therapists (
    profile_id, credential, start_date_of_practice, open_to_new_clients,
    virtual_practice, in_person_practice,
    supervisor_name, supervisor_license,
    sliding_scale_min_cents, sliding_scale_max_cents, superbill
  )
  values
    (jordan, 'LCSW', date '2021-03-01', true, true, false, null, null, 10000, 14000, false),
    (amara, 'PsyD', date '2014-06-01', true, true, true, null, null, null, null, false),
    (luis, 'LPC', date '2018-01-15', true, false, true, null, null, 12000, 15500, false),
    (elena, 'LMFT', date '2019-08-01', true, true, false, null, null, 11000, 15000, false),
    (sam, 'Associate MFT (AMFT)', date '2024-09-01', true, true, false, 'Dana Whitfield', 'MFC 98021', 8000, 11000, true),
    (noah, 'PhD', date '2016-02-01', true, true, true, null, null, null, null, false),
    (fatima, 'LCSW', date '2018-11-01', true, true, false, null, null, 9000, 14500, true),
    (owen, 'LPC', date '2012-04-01', true, false, true, null, null, null, null, false),
    (mei, 'LMFT', date '2015-07-01', true, true, true, null, null, 13000, 17000, false),
    (chris, 'MD', date '2010-09-01', true, true, false, null, null, null, null, false);

  insert into public.licenses (therapist_id, number, state)
  values
    (jordan, 'LCSW 91204', 'CA'),
    (amara, 'PSY 021774', 'NY'),
    (luis, 'LPC 81233', 'TX'),
    (elena, 'MFC 120441', 'CA'),
    (sam, 'AMFT 148220', 'CA'),
    (noah, 'PY 6118823', 'WA'),
    (fatima, '149.023881', 'IL'),
    (owen, 'LPC.0014822', 'CO'),
    (mei, 'MFC 104772', 'CA'),
    (chris, '73422', 'GA');

  insert into public.rates (therapist_id, service_type, duration_minutes, price_cents)
  values
    (jordan, 'Individual', 50, 14000),
    (amara, 'Individual', 50, 19500),
    (amara, 'Couples', 60, 22500),
    (luis, 'Individual', 50, 15500),
    (luis, 'Couples', 50, 18000),
    (elena, 'Individual', 50, 15000),
    (elena, 'Family', 60, 17500),
    (sam, 'Individual', 50, 11000),
    (noah, 'Individual', 50, 18500),
    (fatima, 'Individual', 50, 14500),
    (owen, 'Individual', 50, 16000),
    (mei, 'Individual', 50, 17000),
    (mei, 'Couples', 50, 20000),
    (chris, 'Individual', 45, 22000);

  insert into public.tags (profile_id, kind, label)
  values
    (jordan, 'specialty', 'Anxiety'),
    (jordan, 'specialty', 'Depression'),
    (jordan, 'specialty', 'ADHD'),
    (jordan, 'modality', 'CBT'),
    (jordan, 'modality', 'ACT'),
    (jordan, 'insurance', 'Aetna'),
    (jordan, 'insurance', 'Optum'),
    (jordan, 'identity', 'LGBTQ+'),
    (jordan, 'outreach', 'email'),
    (jordan, 'outreach', 'phone'),
    (amara, 'specialty', 'Trauma & PTSD'),
    (amara, 'specialty', 'Grief & Loss'),
    (amara, 'modality', 'EMDR'),
    (amara, 'modality', 'Somatic'),
    (amara, 'insurance', 'BCBS'),
    (amara, 'insurance', 'Cigna'),
    (amara, 'identity', 'BIPOC'),
    (amara, 'outreach', 'email'),
    (amara, 'outreach', 'phone'),
    (amara, 'outreach', 'text'),
    (luis, 'specialty', 'Couples & Relationships'),
    (luis, 'specialty', 'Life Transitions'),
    (luis, 'modality', 'Psychodynamic'),
    (luis, 'modality', 'Attachment-Based'),
    (luis, 'modality', 'Emotionally Focused'),
    (luis, 'insurance', 'Cash Pay Only'),
    (luis, 'outreach', 'email'),
    (luis, 'outreach', 'phone'),
    (elena, 'specialty', 'Teens'),
    (elena, 'specialty', 'Anxiety'),
    (elena, 'specialty', 'ADHD'),
    (elena, 'modality', 'DBT'),
    (elena, 'modality', 'CBT'),
    (elena, 'insurance', 'Aetna'),
    (elena, 'insurance', 'Cigna'),
    (elena, 'identity', 'BIPOC'),
    (elena, 'outreach', 'email'),
    (elena, 'outreach', 'text'),
    (sam, 'specialty', 'Depression'),
    (sam, 'specialty', 'Life Transitions'),
    (sam, 'modality', 'Psychodynamic'),
    (sam, 'modality', 'Narrative'),
    (sam, 'insurance', 'Out-of-Network Superbill'),
    (sam, 'identity', 'LGBTQ+'),
    (sam, 'identity', 'First-generation'),
    (sam, 'outreach', 'email'),
    (noah, 'specialty', 'ADHD'),
    (noah, 'specialty', 'Life Transitions'),
    (noah, 'modality', 'CBT'),
    (noah, 'modality', 'ACT'),
    (noah, 'insurance', 'Optum'),
    (noah, 'insurance', 'BCBS'),
    (noah, 'outreach', 'email'),
    (noah, 'outreach', 'phone'),
    (fatima, 'specialty', 'Immigration'),
    (fatima, 'specialty', 'Trauma & PTSD'),
    (fatima, 'specialty', 'Anxiety'),
    (fatima, 'modality', 'Narrative'),
    (fatima, 'modality', 'Somatic'),
    (fatima, 'insurance', 'Cash Pay Only'),
    (fatima, 'insurance', 'Out-of-Network Superbill'),
    (fatima, 'identity', 'Immigrant'),
    (fatima, 'identity', 'BIPOC'),
    (fatima, 'identity', 'First-generation'),
    (fatima, 'outreach', 'email'),
    (fatima, 'outreach', 'text'),
    (owen, 'specialty', 'Grief & Loss'),
    (owen, 'specialty', 'Depression'),
    (owen, 'modality', 'Psychodynamic'),
    (owen, 'modality', 'Attachment-Based'),
    (owen, 'insurance', 'Aetna'),
    (owen, 'identity', 'Veteran'),
    (owen, 'outreach', 'email'),
    (owen, 'outreach', 'phone'),
    (mei, 'specialty', 'Couples & Relationships'),
    (mei, 'specialty', 'Life Transitions'),
    (mei, 'modality', 'Attachment-Based'),
    (mei, 'modality', 'Emotionally Focused'),
    (mei, 'insurance', 'Cigna'),
    (mei, 'insurance', 'Aetna'),
    (mei, 'identity', 'First-generation'),
    (mei, 'outreach', 'email'),
    (mei, 'outreach', 'phone'),
    (mei, 'outreach', 'text'),
    (chris, 'specialty', 'Depression'),
    (chris, 'specialty', 'Trauma & PTSD'),
    (chris, 'specialty', 'ADHD'),
    (chris, 'modality', 'Psychodynamic'),
    (chris, 'modality', 'CBT'),
    (chris, 'insurance', 'BCBS'),
    (chris, 'insurance', 'Optum'),
    (chris, 'identity', 'BIPOC'),
    (chris, 'outreach', 'email'),
    (chris, 'outreach', 'phone');

  insert into public.profile_items (therapist_id, prompt, answer, tag)
  values
    (jordan, 'my approach to therapy is...', 'Collaborative and concrete — we name the loop, then try one smaller move this week.', 'approach'),
    (jordan, 'a session with me feels like...', 'A kitchen-table conversation with someone who will also call the pattern when they see it.', 'session_vibe'),
    (jordan, 'I specialize in unpacking...', 'Anxiety that looks like over-functioning, plus the ADHD and low-mood mix that rides along.', 'specialty'),
    (amara, 'my approach to therapy is...', 'Slow enough for the body. We do not outrun what the nervous system cannot hold.', 'approach'),
    (amara, 'a session with me feels like...', 'Quiet, precise, and safer than you expected on a hard week.', 'session_vibe'),
    (amara, 'I specialize in unpacking...', 'Trauma and grief that other people are ready for you to be finished with.', 'specialty'),
    (luis, 'my approach to therapy is...', 'We map the dance. Who pursues, who shuts down, and what each of you is protecting.', 'approach'),
    (luis, 'a session with me feels like...', 'Direct, warm, and a little stubborn about not picking a villain.', 'session_vibe'),
    (luis, 'I specialize in unpacking...', 'Couples stuck on repeat, and the life transitions that light the fuse.', 'specialty'),
    (elena, 'my approach to therapy is...', 'Skills first when the week is on fire, deeper work when there is room.', 'approach'),
    (elena, 'a session with me feels like...', 'Straight talk without talking down — teens can smell a script.', 'session_vibe'),
    (elena, 'I specialize in unpacking...', 'Teen anxiety, ADHD, and the family system around both.', 'specialty'),
    (sam, 'my approach to therapy is...', 'Curious, unhurried, and honest that I am still in training — supervised every week.', 'approach'),
    (sam, 'a session with me feels like...', 'Two people figuring it out together, not a lecture from a finished person.', 'session_vibe'),
    (sam, 'I specialize in unpacking...', 'Depression and the in-between seasons after something ended and the next thing has not started.', 'specialty'),
    (noah, 'my approach to therapy is...', 'We build a container that ADHD brains can actually use, then get curious about the rest.', 'approach'),
    (noah, 'a session with me feels like...', 'Structured without being stiff. There is a plan, and also room to wander.', 'session_vibe'),
    (noah, 'I specialize in unpacking...', 'Adult ADHD and the life transitions that blow up the systems you finally built.', 'specialty'),
    (fatima, 'my approach to therapy is...', 'We hold the family, the paperwork, and the self — none of them get to erase the others.', 'approach'),
    (fatima, 'a session with me feels like...', 'Grounded, bilingual in more than language, never asking you to translate your whole life.', 'session_vibe'),
    (fatima, 'I specialize in unpacking...', 'Immigration stress, first-generation duty, and trauma that does not look like a single event.', 'specialty'),
    (owen, 'my approach to therapy is...', 'I do not rush grief. Functioning is not the same as having somewhere to put it.', 'approach'),
    (owen, 'a session with me feels like...', 'Quiet, sturdy, and allergic to silver linings.', 'session_vibe'),
    (owen, 'I specialize in unpacking...', 'Grief, depression, and the after of service or caregiving.', 'specialty'),
    (mei, 'my approach to therapy is...', 'Attachment first. We look at how you reach and how you protect, in the couple and in the family.', 'approach'),
    (mei, 'a session with me feels like...', 'Warm, culturally fluent, and unwilling to flatten everything into a communication tip.', 'session_vibe'),
    (mei, 'I specialize in unpacking...', 'Couples work and the life transitions that rearrange who you are to each other.', 'specialty'),
    (chris, 'my approach to therapy is...', 'We talk like people. Medication is a tool, not the whole room.', 'approach'),
    (chris, 'a session with me feels like...', 'Calm, medically literate, and not in a hurry to pathologize a hard year.', 'session_vibe'),
    (chris, 'I specialize in unpacking...', 'Depression, trauma, and ADHD — including when they show up together.', 'specialty');

  insert into public.reviews (
    therapist_id, patient_id, stars_avg, body, session_format, duration_label
  )
  values
    (jordan, jr, 5, 'Jordan made the anxiety loops visible without making me feel broken for having them.', 'Virtual', '5 months with Jordan'),
    (amara, priya, 5, 'The first time I did not have to speed-run my story so someone would believe it was trauma.', 'In-person', '9 months with Amara'),
    (luis, dm, 4, 'We still fight. We just recover faster, and I know what I am actually asking for.', 'In-person', '6 months with Luis'),
    (elena, priya, 5, 'My teenager actually stays in the room. That is not nothing.', 'Virtual', '4 months with Elena'),
    (sam, jr, 4, 'Sam is early in the work and says so. The honesty made it easier to be honest back.', 'Virtual', '3 months with Sam'),
    (noah, dm, 5, 'Finally a therapist who treats ADHD as a design problem, not a character flaw.', 'Virtual', '7 months with Noah'),
    (fatima, priya, 5, 'I did not have to explain my family from scratch. We started where I actually live.', 'Virtual', '8 months with Fatima'),
    (owen, jr, 5, 'Owen let the grief be as large as it is. No timeline. No pep talk.', 'In-person', '1 year with Owen'),
    (mei, dm, 4, 'Couples work that did not turn into a debate club. We left knowing the pattern.', 'In-person', '5 months with Mei'),
    (chris, priya, 5, 'He held the meds conversation and the therapy conversation in the same hour without making either small.', 'Virtual', '11 months with Chris');
end;
$$;
