# Agent rules

Read [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) before writing code. It wins over screenshots when they disagree, except visual layout (screenshots win).

## Scope

Company product. **Current product** in REQUIREMENTS is what already ships; **Not built yet** is backlog, not a veto. Build the feature that was asked for. Update REQUIREMENTS when behavior changes. Skill: `product-scope`.

Photo **and** intro video upload exist. Matching still uses one `tags` table unless the task changes that. Interest (`/matches`, I'm interested) is removed.

## Build

Subagent-driven. Independent tasks in parallel; schema/search query sequential. Skill: `implement-with-subagents`.

## Data

One `tags` table. Match is OR on selected tags (some match), one SQL round trip — until we explicitly change matching. Skill: `kitchen-sink-matching`.

## Docs

Short. No essays. Update REQUIREMENTS when behavior changes.

## Git

Commit when asked. Repo: `mkirby42/kitchen_sink`, not the org. Never commit `.env` or the service role key.

## Product decisions

Live asks are in [docs/product-decisions.md](docs/product-decisions.md). The tests in `tests/guards/` lock them.

Never delete, skip, or rewrite a guard test to make CI pass. Never edit the registry to drop an ask. If a new ask conflicts with a registered one, stop. Name the conflict in the PR description and wait for the `product-decision-approved` label. Do not restore a pending or already-replaced ask.

## Next.js 16

Request interceptor file is `proxy.ts`, not `middleware.ts`. Do not re-enable `agentRules` in `next.config.ts` — it overwrites this file.
