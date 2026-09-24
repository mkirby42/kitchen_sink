---
name: kitchen-sink-matching
description: Use when writing or changing Kitchen Sink schema, migrations, RLS, search, therapist filters, tags, or the match query. Covers OR tag matching, indexes, and in-person location rules.
---

# Matching and data

Spec: `docs/REQUIREMENTS.md` (Data + Matching). New tables/kinds only with a migration + REQUIREMENTS update.

## Shape

- `profiles` + `therapists` (1:1) + `licenses` (1:n, multi-state) + `qualifications` (1:n, education + extra credentials; not searched) + `rates` (1:n, multi-service) + `locations` + `tags` + `profile_items` + `reviews` + `feedback`
- Tags: one table, `kind` in `specialty | modality | identity | insurance | outreach`
- Years practicing = `now - start_date_of_practice`, not a stored int

## Match query

OR on selected tags. Therapist must match **at least one** selected tag (specialty or insurance). Session format and license state still apply when selected.

One round trip. Filter in SQL, not JS. Page size 24.

Typical predicates:

- `open_to_new_clients = true`
- virtual / in-person flags
- selected tag labels overlap therapist tags (specialty or insurance)
- `licenses.state` if a state is selected

## Indexes (required)

- unique `(profile_id, kind, label)` on `tags`
- `(kind, label, profile_id)` on `tags`
- `licenses (therapist_id)`, `licenses (state)`
- partial `therapists (profile_id) where open_to_new_clients`

If explain shows a slow join, add `therapists.specialty_labels text[]` + GIN and keep tags in sync.

## In-person

`in_person_practice` true ⇒ location row required. Search uses license state, not lat/lon, until we add geo.

## RLS / perf

Enable RLS on every public table. `(select auth.uid())` in policies. Public read of open therapists + their tags/licenses/items/reviews. Owner writes own rows. A signed-in patient inserts, updates, and deletes their own review (one per therapist). Storage: public read photos/videos; a user writes `photos/{uid}/` and `videos/{uid}/` only. Admins may also write those prefixes for an existing therapist (`/admin/media`). Do not fetch video on `/find`.

No N+1: search cards come from one query (or one RPC).
