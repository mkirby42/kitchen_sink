# Agent rules

Read [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) before writing code. It wins over screenshots when they disagree, except visual layout (screenshots win).

## Scope

If it is not in **Must ship**, do not add it. No booking, no extra tag kinds. Patient UI is **only** profile interest (sign-in + I'm interested). `/matches` is the therapist inbox. Photo **and** intro video upload are in scope. Skills: `hackathon-scope`.

## Build

Subagent-driven. Independent tasks in parallel; schema/search query sequential. Skill: `implement-with-subagents`.

## Data

One `tags` table. Match is OR on selected tags (some match), one SQL round trip. Skill: `kitchen-sink-matching`.

## Docs

Short. No essays. Update REQUIREMENTS only if behavior changes.

## Git

Commit when asked. Repo: `mkirby42/kitchen_sink`, not the org. Never commit `.env` or the service role key.

## Next.js 16

Request interceptor file is `proxy.ts`, not `middleware.ts`. Do not re-enable `agentRules` in `next.config.ts` — it overwrites this file.
