# Kitchen Sink — requirements

Company product. Patients find therapists; therapists publish profiles people can actually evaluate. We are past the hackathon freeze: **shipped is the floor, not the ceiling.** If you add or change product behavior, update this file.

## Product

Patients filter therapists by must-have tags. Therapists publish a readable profile (photo, intro video, tags, rates, conversation cards, contact).

The current app does **not** book sessions or broker intros. Those are on the backlog, not forbidden.

## Current product (shipped)

1. **Find a therapist** — public search. Filters: session format (virtual / in-person), specialties (preset chips), insurance, license state. OR semantics: therapist must match **some** selected tag. Rank by overlap count, then name; cards highlight hits (“3 of 4 tags”). Empty filters = all therapists open to new clients and listed in the directory.
2. **Therapist profile** — photo, **optional intro video**, name, credential (licensed dropdown), **education** and **additional credentials** (freeform text, 0–n rows each), **state license(s)** (min 1, no max — license # + state per row; add/remove rows; show all on profile), years practicing, format, specialties / modalities / insurance (preset chips **plus** therapist-created custom labels; show all on profile), **rates** (min 1, no max — service type + duration + price per row; add/remove rows; show all on profile; optional **sliding scale** checkbox), about, conversation cards, reviews (signed-in patients and admins post one review: display name or anonymous; three required 1–5 ratings — felt understood, communication, and right fit — averaged into the Reviews tab breakdown from approved reviews only; optional written note is the review text; date; pending until an admin approves; the profile counts only approved reviews; signup and the form warn not to include personal health information; reject and delete hard-delete the row with no archive; empty state “No reviews yet.”; therapists, including the owner, cannot review; an admin stays admin, can review another open listed profile, and cannot review their own), contact (email / phone / text as listed). Profile hero plays the intro video when one is uploaded. The owning therapist sees **Edit** (header, top right) and updates the same fields as join. Sliding scale, when offered, shows on the public profile (a previously saved range if one is still stored, otherwise “Available”) and on Find cards (“Sliding scale available”).
3. **Join as a therapist** — Supabase Auth + 4-step onboarding matching the prototype: basic info (name, license number, and state required; education and certificates optional; repeatable state-license rows) → **photo (required, 5MB; join and edit resize oversized photos in the browser) + intro video (optional, file up to 50MB, or an in-browser recording up to 90 seconds where the browser supports it)** → practice tags → cards + contact + optional product feedback. Returning therapists sign in from home (`/join?mode=signin`) and land on their profile. Edit uses the same photo and video step.
4. **Demo seeds removed from hosted data** — Maya Chen and the other accounts inserted by the seed migrations are deleted by `supabase/migrations/20260925043000_finish_demo_profile_removal.sql` (same rule in `20260925003000_remove_seed_demo_profiles.sql`). Delete only when `auth.users.id` **and** `lower(email)` both match that seed list (`*@kitchensink.demo`). Any other signup stays. Storage object rows are not deleted in SQL (hosted `storage.protect_delete`); ownership is cleared and bytes go away through the Storage API. New profiles cannot reuse those ids or that email domain, so a later migrate does not put the fakes back. Search lists therapists who completed join, are open to new clients, and are listed.
5. **Fast match** — one Postgres query, indexed. No N+1. See Matching.
6. **CI** — typecheck + lint + tests on every PR. Preview deploy.
7. **Admin helper upload** — `/admin/media`. An ops admin signs in, picks a therapist (including not open to new clients), and uploads a photo and/or intro video into that therapist's existing storage prefix. Same buckets, mime types, and size limits as join. Only `photo_key` or `video_key` changes. This stays the backup when the therapist's browser cannot resize a photo or record a video. No shared ops password is seeded. Create the Auth user in the Dashboard, then grant `admin` with SQL.
8. **Discoverability** — `/robots.txt` allows search crawlers and these AI user-agents: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended. It disallows `/admin` only. `/sitemap.xml` lists `/`, `/find`, `/join`, and therapists who are open to new clients and listed. `/llms.txt` is a plain-language summary of the product. Public pages set a canonical URL on `https://kitchen-sink-tau.vercel.app` (override with `SITE_URL`).
9. **Delete own profile** — On edit profile (`/join?edit=1`), the signed-in therapist deletes that profile from a danger zone under the form. A dialog requires typing `DELETE`. The public page leaves Find and `/t/[id]`. The profile delete cascades therapist-owned rows: licenses, rates, sliding scale, qualifications, tags, conversation cards, location, feedback, and reviews about them. Photo and intro video objects are removed with the Storage API. The auth user stays, so they can join again. Patients, admins, and other therapists cannot delete it. Afterward they land on `/profile-deleted`.
10. **Admin test profile** — An admin stays `admin` and can open Join to publish one therapist profile on that same account (for testing signup). Submitting Join again replaces that profile, including a leftover therapist row, and keeps `listed`. Find and `/t/[id]` show it when open to new clients and listed. Uploads (`/admin/media`) can hide or show any therapist profile (`admin_set_therapist_listed`). Hiding leaves the account and role in place; the public page uses the same not-found state as a closed practice. `20260925153000_therapist_directory_listing.sql` sets `listed` false for the Christine Lo and Matt Kirby profiles that were already on Find (id + email + name). Every other therapist stays listed. This is not a second login and not a multi-profile directory. A therapist or patient account still cannot join twice. The delete control stays on a therapist edit screen only.
11. **Review moderation** — A client or admin sees a personal-health-information warning on review signup and on the review form. A new review, including one an admin writes on another profile, is `pending` and is not on the public profile. An admin approves it at `/admin/reviews` or rejects it. Reject, and the author's Remove, hard-delete the row. Nothing archives the rejected text. Reviews have no storage objects. Rows that already existed when this shipped stay `approved`.
12. **Forgot password** — Therapist sign-in (`/join?mode=signin`), client review sign-in, and admin sign-in (`/admin/media` and `/admin/reviews`) link to `/forgot-password`. The person enters an email. Supabase Auth sends a reset link. The screen says the same thing whether or not that email has an account. `/reset-password` sets a new password (min 6) for therapist, patient, and admin email/password accounts, then leaves them signed in. Hosted Auth must allow `{origin}/reset-password` as a redirect URL (local `config.toml` already does). The default recovery email works when the link is opened in the same browser; `supabase/templates/recovery.html` uses `token_hash` so a link also works from another device once that template is the one Auth sends.

## Not built yet (backlog, allowed)

These existed as hackathon cuts. They are **in play** whenever we take them on. Update this doc when one ships.

- Booking, calendars, payments; “Free Consult” / “Book a Session” as real scheduling. Today those buttons `mailto:` / `tel:` listed contact.
- Patient onboarding, public patient profiles, stored patient location. Seed reviews still use patient `profiles` rows.
- Video transcoding, multiple intro clips, a video CMS. Today: one clip per therapist, stored as uploaded, native `<video>`.
- Maps, geocoding, distance search. If in-person is selected, **store** location. Search uses license state, not lat/lon.
- Messaging, likes/hearts chrome, realtime. Ops helper upload is shipped (`/admin/media`). Review approve/reject is shipped (`/admin/reviews`).
- Supervisor license **verification** (no legal review). Associate/trainee credentials are not offered.

Patient tables stay in the schema. Expand patient UI when the product needs it.

## Screens (visual source of truth)

Prototype PNGs live in `prototype_screenshots/`. Index: `prototype_screenshots/README.md`. Screenshots win on layout; this file wins on behavior.

| Flow | What it is |
| --- | --- |
| Nav | Home, Find a Therapist, Join as a Therapist. Signed-in therapists see My profile and Sign out instead of Join. Signed-in admins see Uploads, Reviews, and Join as a Therapist. If that admin has a therapist profile, they also see My profile. |
| Therapist onboarding 1 | **Name (required)**, licensed credential dropdown, years practicing, **Education (optional)**, **Credentials & certificates (optional)**, **State license(s)** (min 1; license # and state both required on each kept row; blank extra rows ignored) |
| Therapist onboarding 2 | Photo (required; oversized photos resized in the browser) + intro video (optional, up to 50MB file, or up to 90s recorded in the browser where supported; profile hero plays intro when present) |
| Therapist onboarding 3 | Open to new clients, virtual / in-person, specialties / modalities / insurance (preset chips + “Add your own” custom label per section), identity (tags) |
| Therapist onboarding 4 | **Rates** repeater (service type + session length in minutes + price, remove row, “+ Add another rate”), **Offer sliding scale** checkbox, conversation cards (min 3, max 6), about, private email, outreach (email / phone / text), optional feedback |
| Search | Must-have chips (specialty presets only). Result card: photo/initials, name, credential, years, tags, starting rate (lowest price / duration), sliding scale when offered |
| Profile | Hero (photo + playable intro video) + credential + education + additional credentials + all state licenses (# + state per row) + all rates (service + duration + price) + sliding scale when offered + cards + about + reviews (category breakdown + note) |
| Delete profile | Edit profile only (`/join?edit=1`), under the form. Dialog requires typing `DELETE`. Then `/profile-deleted`. |

Match visual tone: cream page, navy type, terracotta buttons, rounded cards. Do not invent a second design system unless we are deliberately restyling the product.

Rates appear on search cards and profile. They are **not** in the original data notes. Store in `rates` (1:n per therapist). Search card shows lowest price and its duration as “starting rate” (`$165 / 50 min`), plus “Sliding scale available” when offered.

## Data

One `profiles` row per auth user. Role is `therapist`, `patient`, or `admin` (ops). Tag kinds share **one** table, not eight. New kinds need a migration + this doc + the matching skill.

```
profiles
  id uuid PK = auth.uid()
  role text check (therapist | patient | admin)
  name, email, phone, about_me   -- therapist name required (non-blank)
  photo_key, video_key          -- Supabase Storage keys; photo required (browser resize above 5MB), intro video optional (max 50MB; file or short in-browser recording)
  created_at

therapists                      -- 1:1 with therapist profiles
  profile_id PK FK
  credential text             -- licensed dropdown: LMFT, LCSW, LPC, PsyD, PhD, MD
  start_date_of_practice date   -- years practicing = now - this
  open_to_new_clients bool
  listed bool default true          -- false: omit from Find, sitemap, and /t/[id]
  virtual_practice bool
  in_person_practice bool
  sliding_scale bool default false          -- offer sliding scale (checkbox)
  sliding_scale_min_cents, sliding_scale_max_cents  -- legacy range; the form does not collect these; save clears them
  superbill bool default false

qualifications                -- 1:n; optional education + extra credential/cert rows
  id, therapist_id
  kind text                   -- education | credential (not the licensed dropdown)
  label text                  -- freeform; trim; unique per therapist+kind
  position int

rates                         -- 1:n; min 1 row per therapist; add/remove in onboarding + profile edit
  id, therapist_id
  service_type text             -- Individual, Couples, Family, Group
  duration_minutes int          -- whole minutes, 1–480; form is free text (“50 min”)
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

reviews                         -- one row per reviewer profile + therapist (patient or admin)
  id, therapist_id, patient_id (nullable only for a legacy row with no account)
  author_name text              -- public snapshot; null when anonymous
  anonymous bool                -- hide the name; the review stays on the profile
  patient_hidden bool           -- omit the row from the profile (no write UI)
  stars_cat_1 numeric           -- required 1–5: felt understood
  stars_cat_2 numeric           -- required 1–5: communication
  stars_cat_3 numeric           -- required 1–5: right fit
  stars_avg numeric             -- mean of the three; Reviews tab headline
  body text                     -- optional written note, max 2000; this is the review text
  session_format, duration_label
  status text                   -- pending | approved. New rows pending. Reject/delete removes the row; no rejected archive
  created_at
  unique (therapist_id, patient_id)
```

Suggested labels (preset chips; therapist may also add custom labels for specialty, modality, insurance):

- Credentials (fixed dropdown only): LMFT, LCSW, LPC, PsyD, PhD, MD. Shown on search cards and profile as the license type.
- Education and additional credentials (freeform, optional, 0–n): separate repeaters on join/edit. Stored in `qualifications`, not `tags`. Not used by search.
- Rate service types (fixed): Individual, Couples, Family, Group
- Rate session length: free-text whole minutes, 1–480. Shown as “50 min”.
- Specialties (preset + custom): Anxiety, Depression, Trauma & PTSD, Couples & Relationships, ADHD, Grief & Loss, Life Transitions, Teens, Immigration
- Modalities (preset + custom): CBT, DBT, EMDR, Psychodynamic, ACT, Somatic, Narrative, Attachment-Based
- Insurance (preset + custom): Aetna, BCBS, Cigna, Optum, Cash Pay Only, Out-of-Network Superbill
- Outreach (fixed): email, phone, text

**Custom tags:** onboarding shows preset chips plus free-text “Add your own” for specialties, modalities, and insurance. Trim whitespace; store in `tags` like presets; show on profile and result cards. Patient search specialties are the preset chips only — a typed custom label is not a search filter. Insurance search stays preset-only unless we expand it. Query tags outside the specialty and insurance presets are ignored.

Identity tags: small fixed set in onboarding; not a search must-have today.

**In-person rule:** if `in_person_practice` (therapist) is true, a location row must exist. Patient in-person is a search toggle, not a stored patient location today.

RLS: public can `select` therapists who are `open_to_new_clients` and `listed`, including an admin test profile (`role` stays `admin`). Owner can insert/update own rows. A therapist cannot change `listed`. Reviews: public read of `approved` rows for open, listed therapists; the author can read their own pending row; a signed-in patient or admin inserts and updates their own row on an open, listed therapist (that write stays `pending`; role stays put; a therapist cannot review; an admin cannot review their own profile); the author or an admin hard-deletes it. An admin can read the queue and set `status` to `approved`. Reject does not keep a copy. Feedback insert by owner. Storage: public read for photos and intro videos; a user writes only their own prefix (`photos/{uid}/`, `videos/{uid}/`). An admin may also write those buckets under an existing therapist id, which is what `/admin/media` uses. Video is not part of the search card query. There is no profiles DELETE policy. `delete_own_therapist_profile('DELETE')` is the delete path: `auth.uid()` must own a therapist profile. It does not delete `auth.users` or any other profile. Child rows cascade, including reviews about that therapist. Storage bytes are removed with the Storage API, not SQL.

**Admin role.** `admin` is ops. The same account can also hold one therapist profile so ops can test Join. Role stays `admin` (Find and the public page still work when that profile is open to new clients and listed). `admin_set_therapist_listed(therapist_id, listed)` shows or hides one profile. It does not delete the account or change role. An admin can leave one review on another open, listed therapist profile. That does not change `role`. The review stays pending until an admin approves it. They cannot review their own test profile. An API session cannot insert `role = admin` or change its own role (`auth.uid()` is set). Dashboard SQL with no user JWT can. Admins can read therapist profiles and call `admin_set_therapist_media(therapist_id, kind, key)` to set `photo_key` or `video_key` only. There is no seeded ops login. Create the Auth user in the Dashboard (Authentication → Users, email confirmed), then grant `role = admin` with Dashboard SQL. Never commit a password. `20260925170000_remove_seeded_ops_admin.sql` deletes the old seed only when its auth id and `ops@example.com` both still match, demotes a leftover admin profile with that same id and email, and rejects a later insert of that profile. `@kitchensink.demo` is still rejected for new profiles.

Grant Christine Lo (`chrislo5240@gmail.com`) after you add that Auth user (Dashboard → Authentication → Users, email confirmed). She can then use Join on this account; it will not remove admin. Run in the SQL editor:

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

She signs in at `/admin/media` and `/admin/reviews`. The therapist must already have a profile before helper upload. The review queue lists pending client reviews.

## Matching

Access pattern: therapists whose tags **overlap** the patient’s selected tags (match at least one), plus session format and license state when selected. Rank by overlap count, then name. Return `match_count` + `matched_labels` from the same RPC so cards can highlight hits (“3 of 4 tags”).

One RPC or one query. Do not load all therapists and filter in JS. Changing to AND, geo, or pagination should stay one SQL round trip.

```sql
-- tag OR: therapist tags && selected tags (overlap — match at least one)
-- rank: match_count desc, name asc
-- also: open_to_new_clients and listed
-- session format: virtual_practice and/or in_person_practice
-- license state: exists licenses.state = selected
```

Indexes (required, this is the performance story):

- `tags (profile_id, kind, label)` unique
- `tags (kind, label, profile_id)` for reverse lookup
- `licenses (therapist_id)`, `licenses (state)`
- `rates (therapist_id)`
- partial index on `therapists (profile_id) where open_to_new_clients`
- partial index on `therapists (profile_id) where open_to_new_clients and listed`
- optional denormalized `therapists.specialty_labels text[]` with GIN if the join is slower in explain. Prefer the array if we touch matching twice.

Return search cards in **one round trip** (join photo URL, credential, years, a few tags, min rate and its duration, sliding scale flag). Cap page size (24). No unbounded select.

## Stack

- Next.js App Router, TypeScript, Tailwind
- `@supabase/ssr` + `@supabase/supabase-js`
- Supabase hosted Postgres + Auth + Storage
- Vercel

App routes: `/` home, `/find` search, `/t/[id]` profile, `/join` therapist onboarding (auth gated), `/forgot-password` and `/reset-password` (email reset; not indexed), `/profile-deleted` after a therapist deletes their profile, `/admin/media` ops helper upload (auth + admin role), `/admin/reviews` pending review queue (auth + admin role). `/matches` redirects home. `/robots.txt`, `/sitemap.xml`, and `/llms.txt` are public discoverability files.

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

Hosted `/find` lists therapists who completed join, are open to new clients, and are listed. The Maya Chen walkthrough was demo seed data; it is not on the hosted database after the removal migration. A signed-in patient or admin can submit a review on an open, listed profile; it stays pending until an admin approves it. A new therapist can join with a photo (intro video optional) and show up in search when listed. CI is green. Match is one indexed query.
