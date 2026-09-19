# Kitchen Sink

Match therapists to patients. Patients tap must-have tags. We show therapists who match **some** selected tag.

Hackathon build. Spec: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md). Prototype shots: [prototype_screenshots/](prototype_screenshots/).

Production: [kitchen-sink-tau.vercel.app](https://kitchen-sink-tau.vercel.app)

## Stack

Next.js (App Router) · TypeScript · Tailwind · Supabase (Auth, Postgres, Storage) · Vercel

## Run

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

`/` home · `/find` search · `/t/maya` (or `/t/[id]`) profile · `/join` therapist onboarding.

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Migrations live in `supabase/migrations/`. The hosted project already has them. Apply the same files if you stand up a new database. After a reset, upload demo photos/videos with `npm run seed:media` (seed users sign in as themselves; password is `seed-only`).

## Docs

| File | What |
| --- | --- |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | What we ship, what we cut, data, matching, CI |
| [AGENTS.md](AGENTS.md) | How agents work in this repo |
| [prototype_screenshots/README.md](prototype_screenshots/README.md) | Screen → screenshot map |

## CI

GitHub Actions on PR and `main`: lint, typecheck, tests, build. Push to `main` deploys production to Vercel only after those checks pass. Pull requests still get Vercel preview deploys.

Repo secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `VERCEL_DEPLOY_HOOK`. Never put the service role key in CI.
