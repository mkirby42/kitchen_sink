import { TRAVIS_PROFILE_ID, travisWhite } from "./profile.mjs";

const DEMO_DOMAIN = "kitchensink.demo";

function dollarQuote(body, tag = "tw") {
  let safe = tag;
  while (body.includes(`$${safe}$`)) safe += "x";
  return `$${safe}$${body}$${safe}$`;
}

export function applySpec(profile = travisWhite) {
  return {
    email: profile.email.trim().toLowerCase(),
    profileId: profile.profileId,
    name: profile.name,
    phone: profile.phone,
    about: profile.about,
    credential: profile.credential,
    startDate: profile.startDate,
    openToNewClients: profile.openToNewClients,
    listed: profile.listed,
    virtual: profile.virtual,
    inPerson: profile.inPerson,
    slidingScale: profile.slidingScale,
    superbill: profile.superbill,
    licenses: profile.licenses,
    qualifications: profile.qualifications,
    location: profile.location,
    rates: profile.rates,
    tags: profile.tags,
    cards: profile.cards,
  };
}

function assertProfileId(profileId) {
  if (
    typeof profileId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      profileId,
    )
  ) {
    throw new Error("Travis profile id must be a uuid");
  }
  return profileId;
}

export function buildApplySql(profile = travisWhite) {
  const spec = applySpec(profile);
  if (spec.email.endsWith(`@${DEMO_DOMAIN}`)) {
    throw new Error("Refusing to build a demo-seed profile");
  }
  const profileId = assertProfileId(spec.profileId ?? TRAVIS_PROFILE_ID);
  const literal = dollarQuote(JSON.stringify(spec));

  return `
-- Real profile for Travis White. Not a demo seed.
-- Login email is the practice inbox published on thetalkshoppeatx.com.
-- A new auth user gets a random unknown password. Re-runs do not change it.
do $apply$
declare
  spec jsonb := ${literal}::jsonb;
  v_email text := lower(spec->>'email');
  known uuid := '${profileId}';
  uid uuid;
  email_uid uuid;
  known_email text;
  existing_role text;
  existing_name text;
  instance uuid;
begin
  if split_part(v_email, '@', 2) = '${DEMO_DOMAIN}' then
    raise exception 'demo seed profiles are not created on this database';
  end if;

  if coalesce((spec->>'virtual')::boolean, false) is not true
     or coalesce((spec->>'inPerson')::boolean, false) is not true then
    raise exception 'Travis offers both in-person and virtual sessions';
  end if;

  if jsonb_typeof(spec->'licenses') is distinct from 'array'
     or jsonb_array_length(spec->'licenses') < 1
     or coalesce(btrim(spec->'licenses'->0->>'number'), '') = ''
     or coalesce(btrim(spec->'licenses'->0->>'state'), '') = '' then
    raise exception 'At least one state license is required';
  end if;

  if coalesce(btrim(spec->'location'->>'address'), '') = ''
     or coalesce(btrim(spec->'location'->>'state'), '') = ''
     or coalesce(btrim(spec->'location'->>'zip'), '') = '' then
    raise exception 'In-person practice requires an address, state, and zip';
  end if;

  select u.id into email_uid
  from auth.users u
  where lower(u.email) = v_email;

  select u.email into known_email
  from auth.users u
  where u.id = known;

  if email_uid is not null and known_email is not null and email_uid <> known then
    raise exception 'Refusing to apply: email % belongs to %, not Travis profile %',
      v_email, email_uid, known;
  end if;

  if known_email is not null and lower(known_email) is distinct from v_email then
    raise exception 'Refusing to retarget profile % (email %)', known, known_email;
  end if;

  uid := coalesce(email_uid, case when known_email is not null then known else null end);

  if uid is null then
    select u.instance_id into instance from auth.users u limit 1;
    if instance is null then
      instance := '00000000-0000-0000-0000-000000000000';
    end if;

    uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      instance,
      uid,
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', spec->>'name'),
      now(),
      now(),
      false,
      false
    );
  end if;

  if not exists (
    select 1 from auth.identities i
    where i.user_id = uid and i.provider = 'email'
  ) then
    insert into auth.identities (
      user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      uid,
      jsonb_build_object('sub', uid::text, 'email', v_email),
      'email',
      uid::text,
      now(),
      now(),
      now()
    );
  end if;

  select p.role, p.name into existing_role, existing_name
  from public.profiles p
  where p.id = uid;

  if existing_role is not null and existing_role <> 'therapist' then
    raise exception 'Refusing to overwrite a % account for %', existing_role, v_email;
  end if;

  if existing_role = 'therapist'
     and lower(btrim(existing_name)) is distinct from lower(btrim(spec->>'name')) then
    raise exception 'Refusing to overwrite therapist profile %', existing_name;
  end if;

  insert into public.profiles (
    id, role, name, email, phone, about_me, photo_key, video_key
  ) values (
    uid,
    'therapist',
    btrim(spec->>'name'),
    v_email,
    spec->>'phone',
    spec->>'about',
    uid::text || '/photo.jpg',
    uid::text || '/intro.mp4'
  )
  on conflict (id) do update
  set name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      about_me = excluded.about_me,
      photo_key = excluded.photo_key,
      video_key = excluded.video_key;

  insert into public.therapists (
    profile_id, credential, start_date_of_practice, open_to_new_clients, listed,
    virtual_practice, in_person_practice, sliding_scale,
    sliding_scale_min_cents, sliding_scale_max_cents, superbill
  ) values (
    uid,
    spec->>'credential',
    nullif(spec->>'startDate', '')::date,
    coalesce((spec->>'openToNewClients')::boolean, true),
    coalesce((spec->>'listed')::boolean, true),
    coalesce((spec->>'virtual')::boolean, false),
    coalesce((spec->>'inPerson')::boolean, false),
    coalesce((spec->>'slidingScale')::boolean, false),
    null,
    null,
    coalesce((spec->>'superbill')::boolean, false)
  )
  on conflict (profile_id) do update
  set credential = excluded.credential,
      start_date_of_practice = excluded.start_date_of_practice,
      open_to_new_clients = excluded.open_to_new_clients,
      listed = excluded.listed,
      virtual_practice = excluded.virtual_practice,
      in_person_practice = excluded.in_person_practice,
      sliding_scale = excluded.sliding_scale,
      sliding_scale_min_cents = null,
      sliding_scale_max_cents = null,
      superbill = excluded.superbill;

  insert into public.locations (
    profile_id, address, address2, state, zip, lat, lon
  ) values (
    uid,
    spec->'location'->>'address',
    nullif(spec->'location'->>'address2', ''),
    spec->'location'->>'state',
    spec->'location'->>'zip',
    nullif(spec->'location'->>'lat', '')::double precision,
    nullif(spec->'location'->>'lon', '')::double precision
  )
  on conflict (profile_id) do update
  set address = excluded.address,
      address2 = excluded.address2,
      state = excluded.state,
      zip = excluded.zip,
      lat = excluded.lat,
      lon = excluded.lon;

  delete from public.licenses where therapist_id = uid;
  delete from public.rates where therapist_id = uid;
  delete from public.qualifications where therapist_id = uid;
  delete from public.tags where profile_id = uid;
  delete from public.profile_items where therapist_id = uid;

  insert into public.licenses (therapist_id, number, state)
  select uid, btrim(item->>'number'), btrim(item->>'state')
  from jsonb_array_elements(spec->'licenses') item;

  insert into public.rates (
    therapist_id, service_type, duration_minutes, price_cents
  )
  select
    uid,
    item->>'service_type',
    (item->>'duration_minutes')::integer,
    (item->>'price_cents')::integer
  from jsonb_array_elements(spec->'rates') item;

  insert into public.qualifications (therapist_id, kind, label, position)
  select
    uid,
    item->>'kind',
    btrim(item->>'label'),
    coalesce((item->>'position')::integer, 0)
  from jsonb_array_elements(spec->'qualifications') item;

  insert into public.tags (profile_id, kind, label)
  select uid, item->>'kind', btrim(item->>'label')
  from jsonb_array_elements(spec->'tags') item;

  insert into public.profile_items (therapist_id, prompt, answer, tag)
  select uid, item->>'prompt', item->>'answer', item->>'tag'
  from jsonb_array_elements(spec->'cards') item;

  -- Replace-all above drops cards that are no longer in the spec, including
  -- on a profile that already had them. 5 cards is inside the 3–6 rule.
  if exists (
    select 1
    from public.profile_items
    where therapist_id = uid
      and prompt = 'before we start, you should know...'
  ) then
    raise exception 'Travis before-we-start card was not removed';
  end if;

  if (
    select count(*)
    from public.profile_items
    where therapist_id = uid
  ) is distinct from jsonb_array_length(spec->'cards')
     or jsonb_array_length(spec->'cards') < 3
     or jsonb_array_length(spec->'cards') > 6 then
    raise exception 'Travis conversation cards were not saved';
  end if;

  if known_email is not null and uid is distinct from known then
    raise exception 'Travis profile id changed';
  end if;

  if not exists (
    select 1
    from public.therapists t
    where t.profile_id = uid
      and t.virtual_practice
      and t.in_person_practice
  ) then
    raise exception 'Travis session format was not saved';
  end if;

  if not exists (
    select 1
    from public.licenses l
    where l.therapist_id = uid
      and l.number = btrim(spec->'licenses'->0->>'number')
      and l.state = btrim(spec->'licenses'->0->>'state')
  ) then
    raise exception 'Travis state license was not saved';
  end if;

  if not exists (
    select 1
    from public.locations loc
    where loc.profile_id = uid
      and loc.address = spec->'location'->>'address'
      and loc.state = spec->'location'->>'state'
      and loc.zip = spec->'location'->>'zip'
  ) then
    raise exception 'Travis office address was not saved';
  end if;
end
$apply$;
`.trim();
}

export function buildLookupSql(email = travisWhite.email) {
  const literal = dollarQuote(email.trim().toLowerCase(), "em");
  return `select id::text as id from auth.users where lower(email) = ${literal};`;
}
