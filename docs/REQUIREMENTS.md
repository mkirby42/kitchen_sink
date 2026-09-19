# Kitchen Sink — requirements

Hackathon. Hours, not weeks. If it is not in **Must ship**, do not build it.

## Product

Patients find a therapist by must-have filters. Therapists publish a profile clients can actually read (photo, intro video, tags, rates, conversation cards, contact). Kitchen Sink does **not** book sessions or broker intros.

## Must ship

1. **Find a therapist** — public search. Filters: session format (virtual / in-person), specialties (preset chips **plus** free-text “Add your own”), insurance, license state. OR semantics: therapist must match **some** selected tag. Empty filters = all therapists open to new clients.
2. **Therapist profile** — photo, **intro video**, name, credential, **state license(s)** (min 1, no max — license # + state per row; add/remove rows; show all on profile), years practicing, format, specialties / modalities / insurance (preset chips **plus** therapist-created custom labels; show all on profile), **rates** (min 1, no max — service type + duration + price per row; add/remove rows; show all on profile), about, conversation cards, reviews (read-only seed data), contact (email / phone / text as listed). If credential is associate or trainee, collect and show **supervising clinician name** (required) and **supervisor license #**; show a pre-license note on profile. Profile hero plays the intro video.
3. **Join as a therapist** — Supabase Auth + 4-step onboarding matching the prototype: basic info (incl. repeatable state-license rows) → **photo + intro video** → practice tags → cards + contact + optional product feedback.
4. **Seeded demo** — at least one full therapist (Maya Chen from the prototype) with photo and playable intro video so search and profile work with no signups.
5. **Fast match** — one Postgres query, indexed. No N+1. See Matching.
6. **CI** — typecheck + lint + tests on every PR. Preview deploy.

## Cut (do not build)

- Booking, calendars, “Free Consult” / “Book a Session” as real scheduling. Buttons may `mailto:` / `tel:` the listed contact.
- Patient accounts, patient profiles, patient onboarding.
- Review **write** UI. Seed reviews and display them.
- Video transcoding, multiple videos, or a video CMS. One intro clip per therapist, stored as uploaded, played with a native `<video>` player.
- Maps, geocoding, distance search. If in-person is selected, **store** location. Search uses license state, not lat/lon.
- Messaging, likes/hearts, admin moderation, realtime.
- Supervisor license **verification** workflow (no legal review, no blocking publish beyond required fields above).

Patient tables stay in the schema so we do not paint into a corner. No patient UI this weekend.

## Screens (source of truth)

Prototype PNGs live in `prototype_screenshots/`. Index: `prototype_screenshots/README.md`.

| Flow | What it is |
| --- | --- |
| Nav | Home, Find a Therapist, Join as a Therapist |
| Therapist onboarding 1 | Name, credential dropdown, years practicing, **State license(s)** repeater (license # + state per row, remove row, “+ Add another state license”); if associate/trainee credential, supervising clinician name + supervisor license # |
| Therapist onboarding 2 | Photo + intro video upload (prototype shows photo; profile hero has a 1 min intro play button — collect both here) |
| Therapist onboarding 3 | Open to new clients, virtual / in-person, specialties / modalities / insurance (preset chips + “Add your own” custom label per section), identity (tags) |
| Therapist onboarding 4 | **Rates** repeater (service type + duration + price, remove row, “+ Add another rate”), conversation cards (min 1, target 3), about, private email, outreach (email / phone / text), optional feedback |
| Search | Must-have chips (specialties: presets + free-text custom). Result card: photo/initials, name, credential, years, tags, starting rate (lowest price) |
| Profile | Hero (photo + playable intro video) + credential + all state licenses (# + state per row) + supervisor (if associate/trainee) + all rates (service + duration + price) + cards + about + reviews |

Match visual tone: cream page, navy type, terracotta buttons, rounded cards. Do not invent a second design system.

Rates appear on search cards and profile. They are **not** in the original data notes. Store in `rates` (1:n per therapist). Search card shows lowest price as “starting rate”.

## Data

One `profiles` row per auth user. Role is `therapist` or `patient`. Tag kinds share **one** table, not eight.

```
profiles
  id uuid PK = auth.uid()
  role text check (therapist | patient)
  name, email, phone, about_me
  photo_key, video_key          -- Supabase Storage keys; intro video required for ship
  created_at

therapists                      -- 1:1 with therapist profiles
  profile_id PK FK
  credential text
  start_date_of_practice date   -- years practicing = now - this
  open_to_new_clients bool
  virtual_practice bool
  in_person_practice bool
  supervisor_name, supervisor_license  -- required when credential is associate/trainee; null otherwise
  sliding_scale_min_cents, sliding_scale_max_cents  -- nullable
  superbill bool default false

rates                         -- 1:n; min 1 row per therapist; add/remove in onboarding + profile edit
  id, therapist_id
  service_type text             -- Individual, Couples, Family, Group
  duration_minutes int          -- e.g. 50
  price_cents int               -- e.g. 16500
  unique (therapist_id, service_type)

licenses                      -- 1:n; min 1 row per therapist; add/remove in onboarding + profile edit
  id, therapist_id, number, state
  unique (therapist_id, state)  -- one row per state; number + state both required

locations                       -- 1:1, required if in_person_practice
  profile_id PK
  lat, lon                      -- nullable this weekend
  address, address2, state, zip

tags
  id, profile_id, kind, label   -- label = preset chip or therapist-typed custom (specialty/modality/insurance)
  kind: specialty | modality | identity | insurance | outreach
  unique (profile_id, kind, label)

profile_items                   -- conversation cards
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

- Credentials (fixed dropdown only): Associate MFT (AMFT), Associate CSW (ACSW), Associate PC (APCC), Registered Associate / Trainee, LMFT, LCSW, LPC, PsyD, PhD, MD. Associate/trainee values require supervisor fields.
- Rate service types (fixed): Individual, Couples, Family, Group
- Rate durations (minutes, fixed): 30, 45, 50, 60, 90
- Specialties (preset + custom): Anxiety, Depression, Trauma & PTSD, Couples & Relationships, ADHD, Grief & Loss, Life Transitions, Teens, Immigration
- Modalities (preset + custom): CBT, DBT, EMDR, Psychodynamic, ACT, Somatic, Narrative, Attachment-Based
- Insurance (preset + custom): Aetna, BCBS, Cigna, Optum, Cash Pay Only, Out-of-Network Superbill
- Outreach (fixed): email, phone, text

**Custom tags:** onboarding shows preset chips plus free-text “Add your own” for specialties, modalities, and insurance. Trim whitespace; store in `tags` like presets; show on profile and result cards. Patient search specialties also allow free-text “Add your own”; the typed label becomes a selected filter chip and matches therapists with that specialty tag (same OR overlap). Insurance search stays preset-only.

Identity tags: include a small fixed set if shown in onboarding; not a search must-have this weekend.

**In-person rule:** if `in_person_practice` (therapist) is true, a location row must exist. Patient in-person is a search toggle, not a stored patient location this weekend.

RLS: public can `select` therapists who are `open_to_new_clients`. Owner can insert/update own rows. Reviews public read. Feedback insert by owner. Storage: public read for photos and intro videos; write only to own prefix (`photos/{uid}/`, `videos/{uid}/`). Video is not part of the search card query.

## Matching

Access pattern: therapists whose tags **overlap** the patient’s selected tags (match at least one), plus session format and license state when selected.

One RPC or one query. Do not load all therapists and filter in JS.

```sql
-- tag OR: therapist tags && selected tags (overlap — match at least one)
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

App routes: `/` home, `/find` search, `/t/[id]` profile, `/join` therapist onboarding (auth gated).

## Performance (grading)

- Match query < 50ms on seeded data; write an `explain analyze` fixture test or SQL comment with the plan.
- Indexes on every FK and every WHERE/JOIN column used by search.
- RLS policies wrap `auth.uid()` in `(select auth.uid())`.
- Images via Supabase public URL; next/image if it is free, skip if it fights Storage. Intro video loads only on the profile page, not on `/find`. Video via public Storage URL + native `<video>`; no transcoding this weekend.
- No ORM waterfall. Server components fetch; no client waterfall of sequential supabase calls.

## CI / CD

Goal: merge to `main` is production.

1. GitHub Actions: `npm ci`, `tsc`, lint, unit tests (match query + a couple UI tests if Playwright is cheap).
2. Vercel: preview on PR, production on `main`.
3. Migrations live in `supabase/migrations/`. Apply to the linked project from CI or a documented one-liner. Do not click-ops schema.

Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never commit service role. Never expose service role to the browser.

## Build order

Sequential where files collide; parallel otherwise.

1. Next.js skeleton + gitignore already here + CI workflow that runs tsc/lint (even if tests are a stub).
2. Supabase schema + RLS + indexes + seed (Maya Chen + reviews).
3. Match query + tests.
4. Search UI (`/find`).
5. Profile UI (`/t/[id]`).
6. Auth + onboarding (`/join`).
7. Storage photo + intro video upload.
8. Polish to screenshots + Vercel project.

2 and 3 before any UI that reads therapists. 4 and 5 can run in parallel after 3. 6 after 2. 7 with 6.

## Done when

A judge can open `/find`, tap Anxiety, see Maya, open her profile, play the intro video, read cards and reviews, and (as a new user) join as a therapist with photo + video and appear in search. CI is green. Match is one indexed query.
