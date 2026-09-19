# Kitchen Sink

Match therapists to patients. Patients tap must-have tags. We show therapists who match **some** selected tag.

Hackathon build. Spec: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md). Prototype shots: [prototype_screenshots/](prototype_screenshots/).

## Stack

Next.js (App Router) · TypeScript · Tailwind · Supabase (Auth, Postgres, Storage) · Vercel

## Run

```bash
cp .env.example .env.local
# fill Supabase URL + anon key (pages render without them)
npm install
npm run dev
```

`/` home · `/find` search · `/t/[id]` profile · `/join` therapist signup. Shell only until schema lands.

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Needs a local or hosted Supabase project. Apply migrations from `supabase/migrations/` once they exist.

## Docs

| File | What |
| --- | --- |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | What we ship, what we cut, data, matching, CI |
| [AGENTS.md](AGENTS.md) | How agents work in this repo |
| [prototype_screenshots/README.md](prototype_screenshots/README.md) | Screen → screenshot map |

## CI

GitHub Actions on PR and `main`: typecheck, lint, tests. Repo secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never put the service role key in CI. Vercel deploys previews and production. Details in the requirements doc.
