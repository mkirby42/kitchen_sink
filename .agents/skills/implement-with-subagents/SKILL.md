---
name: implement-with-subagents
description: Use when implementing Kitchen Sink from the requirements doc or a build plan. Dispatches subagents in parallel when tasks do not share files, sequential when they do.
---

# Implement with subagents

Controller stays in this session. Fresh subagent per task. Paste full task text; do not make the subagent read the whole plan file.

## Foundations

Core app (schema, match RPC, search, profile, join, storage, Vercel) already ships. New work follows the current task, not the old 1–8 hackathon order.

When a task **does** touch schema and the search query, do those sequential. Independent UI can still run in parallel.

## Dispatch

- Independent files → parallel `generalPurpose` subagents
- Shared schema, git conflicts, or one file both would edit → sequential
- Mechanical (one component, spec is complete) → fast model
- Schema, matching SQL, RLS → stronger model

Each implementer gets: the task, relevant REQUIREMENTS excerpt, files to touch, acceptance checks.

## Review

After each task: spec check against REQUIREMENTS + the task (behavior matches what we asked for; REQUIREMENTS updated if behavior changed). Fix before the next task.

Skip a second style-only review unless the code is messy enough to slow the next agent.

## Done

Acceptance for **this** task is met. CI green. If matching changed, still one indexed query (or an explicit new contract in REQUIREMENTS).
