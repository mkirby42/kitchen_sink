# Kitchen Sink

Patients tap must-have tags. We show therapists who match **some** selected tag. Therapists publish a readable profile (photo, intro video, licenses, rates, cards). No booking.

Repo: [github.com/mkirby42/kitchen_sink](https://github.com/mkirby42/kitchen_sink)
Live: [kitchen-sink-tau.vercel.app](https://kitchen-sink-tau.vercel.app)

Spec: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md). Prototype shots: [prototype_screenshots/](prototype_screenshots/).

## Quick start

Node 22. Uses the hosted Supabase project already seeded for the demo.

```bash
git clone https://github.com/mkirby42/kitchen_sink.git
cd kitchen_sink
cp .env.example .env.local
# paste NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (see Reproduce the demo)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | What |
| --- | --- |
| `/` | Home (Find, Join, **Log in as a therapist**) |
| `/find` | Public search |
| `/t/maya` | Seeded Maya Chen profile (owner sees **Edit**) |
| `/join` | Therapist onboarding (auth). Returning therapists sign in from home and land on their profile |

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Tech stack

Next.js 16 App Router · TypeScript · Tailwind · `@supabase/ssr` + `@supabase/supabase-js` · hosted Supabase (Auth, Postgres, Storage) · Vercel · GitHub Actions

```mermaid
flowchart LR
  Browser --> Next["Next.js on Vercel"]
  Next --> Auth[Supabase Auth]
  Next --> RPC["Postgres RPCs + RLS"]
  Next --> Store[Storage photos / videos]
  RPC --> DB[("profiles · therapists · tags · rates · licenses · reviews")]
```

- `/find` calls one RPC, `search_therapists` — OR overlap on selected tags, ranked by match count, page size 24.
- `/t/[id]` loads one therapist (photo + native `<video>` intro). The owner sees **Edit** (header, top right).
- `/join` is a 4-step therapist wizard; photo required, intro video optional (50MB). Returning therapists sign in from home and land on their profile; **Save changes** calls `update_therapist_profile`.
- `proxy.ts` refreshes the Supabase session. Schema lives in `supabase/migrations/`.

## Reproduce the demo

### Option A — live app (fastest)

1. Open [kitchen-sink-tau.vercel.app/find](https://kitchen-sink-tau.vercel.app/find).
2. Tap **Anxiety**. Maya Chen is in the results (ranked by overlap).
3. Open her profile (`/t/maya`). Play the intro video. Read cards and seed reviews.
4. From home, **Log in as a therapist** as Maya (`maya@kitchensink.demo` / `seed-only`). You land on her profile; **Edit** is top-right.

### Option B — local app, same hosted data

Create a `.env.local` from the sample below. Keys come from the Supabase project **API** page (anon / publishable key only). No other API keys.

```bash
# .env.local — copy from .env.example
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...   # anon / publishable, not service_role
```

Then `npm install && npm run dev` and follow Option A on localhost.

Seed accounts (password is always `seed-only`):

| Email | Role | Use |
| --- | --- | --- |
| `maya@kitchensink.demo` | therapist | Profile owner |
| `jr@kitchensink.demo` | patient | Seed patient profile |
| `priya@kitchensink.demo` | patient | Seed reviews |
| `dm@kitchensink.demo` | patient | Seed reviews |

Ten more therapists (`jordan@` … `chris@kitchensink.demo`) fill search. Same password.

### Option C — empty Supabase project

1. Create a project. Enable email Auth. Create public Storage buckets `photos` and `videos`.
2. Apply `supabase/migrations/` in filename order (`supabase db push` against the linked project, or the SQL editor).
3. Put the two public env vars in `.env.local`.
4. Upload seed portraits/videos: `npm run seed:media` (signs in as each seed user; password `seed-only`).
5. `npm run dev`.

`SUPABASE_SERVICE_ROLE_KEY` is **not** required for the app, tests, or `seed:media`. Never put the service role in the browser, Vercel public env, or git.

## Data and provenance

Nothing here is a real clinician, patient, license, review, or clinical dataset. No third-party health registry was imported.

| What | Where | Provenance |
| --- | --- | --- |
| Maya Chen (LMFT, CA, rates, cards, 3 reviews) | `supabase/migrations/20260919163316_seed_maya_chen.sql` | Written to match [prototype_screenshots/](prototype_screenshots/) |
| 10 more open therapists + reviews | `supabase/migrations/20260919184500_seed_demo_therapists.sql` | Authored synthetic profiles so `/find` has multiple OR matches |
| Seed patients J.R., Priya S., D.M. | same Maya seed | Prototype reviewer names; emails are `*@kitchensink.demo` |
| Tag / credential / insurance chips | `lib/tags/presets.ts` + requirements | Prototype + spec labels, not a published taxonomy |
| Headshots + intro clips | `supabase/seed/media/<uuid>/` | Synthetic portraits generated for the demo (not real people). `scripts/prepare-demo-media.sh` crops to 720² JPEG and builds a 4s silent Ken Burns MP4 with ffmpeg. Uploaded by `scripts/seed-demo-media.mjs` |

License numbers, phones, and addresses are fake. Reviews are fiction.

## Known limitations (today)

- No booking, calendars, or in-app messaging. Contact buttons are `mailto:` / `tel:` from listed outreach.
- Reviews are read-only seed data.
- Search is OR overlap (some tags), not AND. Results cap at 24; no pagination UI.
- In-person location is stored; search uses license state, not maps or distance.
- One intro clip per therapist, played as uploaded. No transcoding.
- Associate/trainee credentials are not offered. Education and extra credentials are freeform lists on the profile.
- No patient onboarding or public patient pages.

These are product gaps, not a freeze. See REQUIREMENTS **Not built yet**.

## Next

- Consult / session booking
- In-app messaging
- License verification and real identity checks
- AND filters, pagination, maps
- Review write path and video transcoding
- Custom domain on Vercel (Auth Site URL + redirect allowlist)

## Docs

| File | What |
| --- | --- |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Current product, backlog, schema, matching, CI |
| [AGENTS.md](AGENTS.md) | How agents work in this repo |
| [prototype_screenshots/README.md](prototype_screenshots/README.md) | Screen → screenshot map |

## CI

GitHub Actions on PR and `main`: lint, typecheck, tests, build. Push to `main` deploys production to Vercel after those checks pass. PRs still get Vercel previews.

Repo secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `VERCEL_DEPLOY_HOOK`. Never put the service role key in CI.
