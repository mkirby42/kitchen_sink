# Kitchen Sink — requirements

Company product. Patients find therapists; therapists publish profiles people can actually evaluate. We are past the hackathon freeze: **shipped is the floor, not the ceiling.** If you add or change product behavior, update this file.

## Product

Patients filter therapists by must-have tags. Therapists publish a readable profile (photo, intro video, tags, rates, conversation cards, contact).

The current app does **not** book sessions or broker intros. Those are on the backlog, not forbidden.

## Current product (shipped)

1. **Find a therapist** — public search. Filters: session format (virtual / in-person), specialties (preset chips **plus** free-text “Add your own”), insurance, license state. OR semantics: therapist must match **some** selected tag. Rank by overlap count, then name; cards highlight hits (“3 of 4 tags”). Empty filters = all therapists open to new clients.
2. **Therapist profile** — photo, **optional intro video**, name, credential (licensed dropdown), **education** and **additional credentials** (freeform text, 0–n rows each), **state license(s)** (min 1, no max — license # + state per row; add/remove rows; show all on profile), years practicing, format, specialties / modalities / insurance (preset chips **plus** therapist-created custom labels; show all on profile), **rates** (min 1, no max — service type + duration + price per row; add/remove rows; show all on profile), about, conversation cards, reviews (read-only; no write UI), contact (email / phone / text as listed). Profile hero plays the intro video when one is uploaded. The owning therapist sees **Edit** (header, top right) and updates the same fields as join.
3. **Join as a therapist** — Supabase Auth + 4-step onboarding matching the prototype: basic info (name, license number, and state required; education and certificates optional; repeatable state-license rows) → **photo (required) + intro video (optional, up to 50MB)** → practice tags → cards + contact + optional product feedback. Returning therapists sign in from home (`/join?mode=signin`) and land on their profile.
4. **Demo seeds removed from hosted data** — Maya Chen and the other accounts inserted by the seed migrations are deleted by `supabase/migrations/20260925003000_remove_seed_demo_profiles.sql`. Delete only when `auth.users.id` **and** `lower(email)` both match that seed list (`*@kitchensink.demo`). Any other signup stays. New profiles cannot reuse those ids or that email domain, so a later migrate does not put the fakes back. Search lists therapists who completed join.
5. **Fast match** — one Postgres query, indexed. No N+1. See Matching.
6. **CI** — typecheck + lint + tests on every PR. Preview deploy.
7. **Admin helper upload** — `/admin/media`. An ops admin signs in, picks a therapist (including not open to new clients), and uploads a photo and/or intro video into that therapist's existing storage prefix. Same buckets, mime types, and size limits as join. Only `photo_key` or `video_key` changes.

## Not built yet (backlog, allowed)

These existed as hackathon cuts. They are **in play** whenever we take them on. Update this doc when one ships.

- Booking, calendars, payments; “Free Consult” / “Book a Session” as real scheduling. Today those buttons `mailto:` / `tel:` listed contact.
- Patient onboarding, public patient profiles, stored patient location. Seed reviews still use patient `profiles` rows.
- Review **write** UI. Seed reviews and display them today.
- Video transcoding, multiple intro clips, a video CMS. Today: one clip per therapist, stored as uploaded, native `<video>`.
- Maps, geocoding, distance search. If in-person is selected, **store** location. Search uses license state, not lat/lon.
- Messaging, likes/hearts chrome, admin moderation queue, realtime. Ops helper upload is shipped (`/admin/media`); approve/reject moderation is not.
- Supervisor license **verification** (no legal review). Associate/trainee credentials are not offered.

Patient tables stay in the schema. Expand patient UI when the product needs it.

## Screens (visual source of truth)

Prototype PNGs live in `prototype_screenshots/`. Index: `prototype_screenshots/README.md`. Screenshots win on layout; this file wins on behavior.

| Flow | What it is |
| --- | --- |
| Nav | Home, Find a Therapist, Join as a Therapist. Signed-in therapists see My profile and Sign out instead of Join. Signed-in admins see Uploads. |
| Therapist onboarding 1 | **Name (required)**, licensed credential dropdown, years practicing, **Education (optional)**, **Credentials & certificates (optional)**, **State license(s)** (min 1; license # and state both required on each kept row; blank extra rows ignored) |
| Therapist onboarding 2 | Photo (required) + intro video (optional, up to 50MB; prototype shows photo; profile hero plays intro when present) |
| Therapist onboarding 3 | Open to new clients, virtual / in-person, specialties / modalities / insurance (preset chips + “Add your own” custom label per section), identity (tags) |
| Therapist onboarding 4 | **Rates** repeater (service type + duration + price, remove row, “+ Add another rate”), conversation cards (min 3, max 6), about, private email, outreach (email / phone / text), optional feedback |
| Search | Must-have chips (specialties: presets + free-text custom). Result card: photo/initials, name, credential, years, tags, starting rate (lowest price / duration) |
| Profile | Hero (photo + playable intro video) + credential + education + additional credentials + all state licenses (# + state per row) + all rates (service + duration + price) + cards + about + reviews |

Match visual tone: cream page, navy type, terracotta buttons, rounded cards. Do not invent a second design system unless we are deliberately restyling the product.

Rates appear on search cards and profile. They are **not** in the original data notes. Store in `rates` (1:n per therapist). Search card shows lowest price and its duration as “starting rate” (`$165 / 50 min`).

## Data

One `profiles` row per auth user. Role is `therapist`, `patient`, or `admin` (ops). Tag kinds share **one** table, not eight. New kinds need a migration + this doc + the matching skill.

```
profiles
  id uuid PK = auth.uid()
  role text check (therapist | patient | admin)
  name, email, phone, about_me   -- therapist name required (non-blank)
  photo_key, video_key          -- Supabase Storage keys; photo required, intro video optional (max 50MB)
  created_at

therapists                      -- 1:1 with therapist profiles
  profile_id PK FK
  credential text             -- licensed dropdown: LMFT, LCSW, LPC, PsyD, PhD, MD
  start_date_of_practice date   -- years practicing = now - this
  open_to_new_clients bool
  virtual_practice bool
  in_person_practice bool
  sliding_scale_min_cents, sliding_scale_max_cents  -- nullable
  superbill bool default false

qualifications                -- 1:n; optional education + extra credential/cert rows
  id, therapist_id
  kind text                   -- education | credential (not the licensed dropdown)
  label text                  -- freeform; trim; unique per therapist+kind
  position int

rates                         -- 1:n; min 1 row per therapist; add/remove in onboarding + profile edit
  id, therapist_id
  service_type text             -- Individual, Couples, Family, Group
  duration_minutes int          -- e.g. 50
  price_cents int               -- e.g. 16500; publish requires >= 100 ($1)
  unique (therapist_id, service_type)

licenses                      -- 1:n; min 1 row per therapist; add/remove in onboarding + profile edit
  id, therapist_id, number, state
  unique (therapist_id, state)  -- one row per state; number + state both required

locations                       -- 1:1, required if in_person_practice
  profile_id PK
  lat, lon                      -- stored; unused by search today
  address, address2, state, zip

tags
  id, profile_id, kind, label   -- label = preset chip or therapist-typed custom (specialty/modality/insurance)
  kind: specialty | modality | identity | insurance | outreach
  unique (profile_id, kind, label)

profile_items                   -- conversation cards; 3–6 rows per therapist
  id, therapist_id, prompt, answer, tag
  tag: approach | session_vibe | specialty | about | outcome | custom

feedback
  id, profile_id, body, created_at

reviews
  id, therapist_id, patient_id (nullable for seed)
  patient_hidden bool
  stars_avg numeric             -- display stars
  stars_cat_1, stars_cat_2, stars_cat_3  -- store, no UI
  body, session_format, duration_label
  created_at
```

Suggested labels (preset chips; therapist may also add custom labels for specialty, modality, insurance):

- Credentials (fixed dropdown only): LMFT, LCSW, LPC, PsyD, PhD, MD. Shown on search cards and profile as the license type.
- Education and additional credentials (freeform, optional, 0–n): separate repeaters on join/edit. Stored in `qualifications`, not `tags`. Not used by search.
- Rate service types (fixed): Individual, Couples, Family, Group
- Rate durations (minutes, fixed): 30, 45, 50, 60, 90
- Specialties (preset + custom): Anxiety, Depression, Trauma & PTSD, Couples & Relationships, ADHD, Grief & Loss, Life Transitions, Teens, Immigration
- Modalities (preset + custom): CBT, DBT, EMDR, Psychodynamic, ACT, Somatic, Narrative, Attachment-Based
- Insurance (preset + custom): Aetna, BCBS, Cigna, Optum, Cash Pay Only, Out-of-Network Superbill
- Outreach (fixed): email, phone, text

**Custom tags:** onboarding shows preset chips plus free-text “Add your own” for specialties, modalities, and insurance. Trim whitespace; store in `tags` like presets; show on profile and result cards. Patient search specialties also allow free-text “Add your own”; the typed label becomes a selected filter chip and matches therapists with that specialty tag (same OR overlap). Insurance search stays preset-only unless we expand it.

Identity tags: small fixed set in onboarding; not a search must-have today.

**In-person rule:** if `in_person_practice` (therapist) is true, a location row must exist. Patient in-person is a search toggle, not a stored patient location today.

RLS: public can `select` therapists who are `open_to_new_clients`. Owner can insert/update own rows. Reviews public read. Feedback insert by owner. Storage: public read for photos and intro videos; a user writes only their own prefix (`photos/{uid}/`, `videos/{uid}/`). An admin may also write those buckets under an existing therapist id, which is what `/admin/media` uses. Video is not part of the search card query.

**Admin role.** `admin` is ops, not a therapist and not a patient. An API session cannot insert `role = admin` or change its own role (`auth.uid()` is set). Dashboard SQL with no user JWT can. Admins can read therapist profiles and call `admin_set_therapist_media(therapist_id, kind, key)` to set `photo_key` or `video_key` only. Demo login after migrations: `ops@example.com` / `seed-only`. Not a `@kitchensink.demo` address — that domain is rejected for new profiles.

Grant Christine Lo (`chrislo5240@gmail.com`) after you add that Auth user (Dashboard → Authentication → Users, email confirmed). Do not finish therapist join on this account. Run in the SQL editor:

```sql
do $$
declare
  uid uuid;
  current_role text;
begin
  select id into uid
  from auth.users
  where lower(email) = lower('chrislo5240@gmail.com');

  if uid is null then
    raise exception 'No Auth user for chrislo5240@gmail.com. Add the user in Authentication first.';
  end if;

  select role into current_role from public.profiles where id = uid;

  if current_role in ('therapist', 'patient') then
    raise exception 'Refusing to turn a % profile into admin. Use a dedicated ops login.', current_role;
  end if;

  insert into public.profiles (id, role, name, email)
  values (uid, 'admin', 'Christine Lo', 'chrislo5240@gmail.com')
  on conflict (id) do update
  set role = 'admin',
      name = excluded.name,
      email = excluded.email;
end $$;
```

She signs in at `/admin/media`. The therapist must already have a profile.

## Matching

Access pattern: therapists whose tags **overlap** the patient’s selected tags (match at least one), plus session format and license state when selected. Rank by overlap count, then name. Return `match_count` + `matched_labels` from the same RPC so cards can highlight hits (“3 of 4 tags”).

One RPC or one query. Do not load all therapists and filter in JS. Changing to AND, geo, or pagination should stay one SQL round trip.

```sql
-- tag OR: therapist tags && selected tags (overlap — match at least one)
-- rank: match_count desc, name asc
-- also: open_to_new_clients
-- session format: virtual_practice and/or in_person_practice
-- license state: exists licenses.state = selected
```

Indexes (required, this is the performance story):

- `tags (profile_id, kind, label)` unique
- `tags (kind, label, profile_id)` for reverse lookup
- `licenses (therapist_id)`, `licenses (state)`
- `rates (therapist_id)`
- partial index on `therapists (profile_id) where open_to_new_clients`
- optional denormalized `therapists.specialty_labels text[]` with GIN if the join is slower in explain. Prefer the array if we touch matching twice.

Return search cards in **one round trip** (join photo URL, credential, years, a few tags, min rate). Cap page size (24). No unbounded select.

## Stack

- Next.js App Router, TypeScript, Tailwind
- `@supabase/ssr` + `@supabase/supabase-js`
- Supabase hosted Postgres + Auth + Storage
- Vercel

App routes: `/` home, `/find` search, `/t/[id]` profile, `/join` therapist onboarding (auth gated), `/admin/media` ops helper upload (auth + admin role). `/matches` redirects home.

## Performance

- Match query < 50ms on a small directory; write an `explain analyze` fixture test or SQL comment with the plan.
- Indexes on every FK and every WHERE/JOIN column used by search.
- RLS policies wrap `auth.uid()` in `(select auth.uid())`.
- Images via Supabase public URL; next/image if it is free, skip if it fights Storage. Intro video loads only on the profile page, not on `/find`. Video via public Storage URL + native `<video>`; no transcoding today.
- No ORM waterfall. Server components fetch; no client waterfall of sequential supabase calls.

## CI / CD

Goal: merge to `main` is production.

1. GitHub Actions: `npm ci`, `tsc`, lint, unit tests (match query + UI tests).
2. Vercel: preview on PR, production on `main`.
3. Migrations live in `supabase/migrations/`. Apply to the linked project from CI or a documented one-liner. Do not click-ops schema.

Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never commit service role. Never expose service role to the browser.

## Foundations (already shipped)

1. Next.js skeleton + CI
2. Supabase schema + RLS + indexes. Demo seed rows are removed from hosted data by the later removal migration.
3. Match query + tests
4. Search UI (`/find`)
5. Profile UI (`/t/[id]`)
6. Auth + onboarding (`/join`)
7. Storage photo + intro video upload
8. Visual polish + Vercel project

Schema/search query still sequential when both change. New product work does not have to follow this list.

## Demo path

Hosted `/find` lists therapists who completed join and are open to new clients. The Maya Chen walkthrough was demo seed data; it is not on the hosted database after the removal migration. A new therapist can join with a photo (intro video optional) and show up in search. CI is green. Match is one indexed query.
