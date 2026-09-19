---
name: implement-with-subagents
description: Use when implementing Kitchen Sink from the requirements doc or a build plan. Dispatches subagents in parallel when tasks do not share files, sequential when they do.
---

# Implement with subagents

Controller stays in this session. Fresh subagent per task. Paste full task text; do not make the subagent read the whole plan file.

## Order

From `docs/REQUIREMENTS.md` Build order:

1. App skeleton + CI
2. Schema + RLS + indexes + seed
3. Match query + tests
4. Search UI
5. Profile UI
6. Auth + onboarding
7. Photo + intro video upload
8. Visual polish + Vercel

`2 → 3` sequential. `4` and `5` parallel after `3`. `6` after `2`. `7` with `6`.

## Dispatch

- Independent files → parallel `generalPurpose` subagents
- Shared schema, git conflicts, or one file both would edit → sequential
- Mechanical (one component, spec is complete) → fast model
- Schema, matching SQL, RLS → stronger model

Each implementer gets: Must ship / Cut excerpt, files to touch, acceptance checks, "do not add features".

## Review (light, hackathon)

After each task: one spec check against REQUIREMENTS (did they add Cut items? did they skip Must ship?). Fix before the next task.

Skip a second style-only review unless the code is messy enough to slow the next agent.

## Done

Judge path works: `/find` → Maya profile (play intro) → `/join` (photo + video). CI green. Match is one indexed query. Then stop.
