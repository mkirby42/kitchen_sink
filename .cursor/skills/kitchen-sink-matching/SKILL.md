---
name: kitchen-sink-matching
description: Use when writing or changing Kitchen Sink schema, migrations, RLS, search, therapist filters, tags, or the match query. Covers AND specialty matching, indexes, and in-person location rules.
---

# Matching and data

Spec: `docs/REQUIREMENTS.md` (Data + Matching). Do not invent tables.

## Shape

- `profiles` + `therapists` (1:1) + `licenses` + `locations` + `tags` + `profile_items` + `reviews` + `feedback`
- Tags: one table, `kind` in `specialty | modality | identity | insurance | outreach`
- Years practicing = `now - start_date_of_practice`, not a stored int

## Match query

AND across selected filters. Therapist must have **every** selected specialty.

One round trip. Filter in SQL, not JS. Page size 24.

Typical predicates:

- `open_to_new_clients = true`
- virtual / in-person flags
- specialty labels contained in therapist specialty tags
- insurance overlap if selected
- `licenses.state` if a state is selected

## Indexes (required)

- unique `(profile_id, kind, label)` on `tags`
- `(kind, label, profile_id)` on `tags`
- `licenses (therapist_id)`, `licenses (state)`
- partial `therapists (profile_id) where open_to_new_clients`

If explain shows a slow join, add `therapists.specialty_labels text[]` + GIN and keep tags in sync.

## In-person

`in_person_practice` true ⇒ location row required. Search still uses license state, not lat/lon this weekend.

## RLS / perf

Enable RLS on every public table. `(select auth.uid())` in policies. Public read of open therapists + their tags/licenses/items/reviews. Owner writes own rows. Storage: public read photos/videos; write `photos/{uid}/` and `videos/{uid}/` only. Do not fetch video on `/find`.

No N+1: search cards come from one query (or one RPC).
