# Kitchen Sink — requirements

Company product. Patients find therapists; therapists publish profiles people can actually evaluate. We are past the hackathon freeze: **shipped is the floor, not the ceiling.** If you add or change product behavior, update this file.

## Product

Patients filter therapists by must-have tags. Therapists publish a readable profile (photo, intro video, tags, rates, conversation cards, contact).

The current app does **not** book sessions or broker intros. Those are on the backlog, not forbidden.

## Current product (shipped)

1. **Find a therapist** — public search. No client account. Filters: session format (virtual / in-person), what brings you to therapy (specialty preset chips; the heading is “What brings you to therapy?”), insurance, license state (a state code). OR semantics: therapist must match **some** selected tag. Rank by overlap count, then name. Cards still show the overlap count (“3 of 4 tags”). Specialty and insurance chips are only labels in the current filters for that group; an empty specialty filter or empty insurance filter omits that group. Chips are not highlighted. Empty filters = all therapists open to new clients and listed in the directory. Filters stay in the page address. They are not saved on a client account. A free-text specialty, symptom, or other note is removed from the address and is not searched. Result cards do not show cost, rate, price, session length, or sliding scale. From `md` up each result is one wide paper card (the Find column is `max-w-5xl`; the headline and filters stay `max-w-3xl`). The left ~30% is a tall portrait when there is a photo or intro video (`object-cover`). An intro video uses that photo as the poster (initials if there is no photo) and a white pill at the bottom-left, “Watch {first name}'s intro”, with a clay circle play icon. Click or tap plays inline in that column and does not open the profile. The file is not requested until then (`preload="none"`; no `src` until play). Playback stays fully visible (`object-contain`). No photo and no video: that column is omitted and initials sit beside the name. The right side is a large navy serif name, then the credential in small gray — short code plus a title when we have one (“PsyD · Licensed Psychologist”; LMFT, LCSW, and LPC expand the same way; PhD and MD stay the stored code). Years practicing stay on the phone card only. Small gray pills at the top-right show Virtual (camera icon) and In-Person (pin icon) for the formats they offer. Then the first conversation card in saved order (`profile_items.position` ascending): a small clay italic prompt with a sparkle, and a large navy serif answer with a light quote mark. No cards: nothing extra. Outlined pills list only matching specialty and insurance labels (omit a group when that filter is empty; no chip highlight). Session format is the top-right pills, not those chips. The overlap count still reads “3 of 4 tags”. A thin divider, then a navy pill “Get to know {first name} →” links to the profile. Below `md` the previous card stays: a portrait (9:16) frame when there is an intro video (`object-contain`, not cropped; stacks above the info below `sm`) with the see-through play control (inline play; the card links to the profile except that control; file loads on play), or a circular photo or initials when there is no video, plus name, credential, years, format chips, matching tags, and the conversation card.
2. **Therapist profile** — photo, **optional intro video**, name, credential (licensed dropdown), **education** and **additional credentials** (freeform text, 0–n rows each), **state license(s)** (min 1, no max — license # + state per row; add/remove rows; show all on profile), years practicing, specialties (the public page shows only that therapist's specialties that are also on the Find specialty list; other specialty tags stay stored and are not shown), approach in therapy and insurance (preset chips **plus** therapist-created custom labels; show all on profile; the approach section title is Approach in Therapy on the public profile and on join/edit; a bare stored acronym displays as the full name with that acronym in parentheses, and a phrase stays as stored), **rates** (min 1, no max — service type + duration + price per row; add/remove rows; show all on profile; optional **sliding scale** checkbox), about, conversation cards, reviews (signed-in patients and admins post one review: display name or anonymous; three required 1–5 ratings — felt understood, communication, and right fit — averaged into the Reviews tab breakdown from approved reviews only; optional written note is the review text; date; pending until an admin approves; the profile counts only approved reviews; signup and the form warn not to include personal health information; reject and delete hard-delete the row with no archive; empty state “No reviews yet.”; therapists, including the owner, cannot review; an admin stays admin, can review another open listed profile, and cannot review their own), contact (email / phone / text as listed). Profile hero plays the intro video when one is uploaded. Below `md`, the photo overlay is only the name and license caption (for example “Licensed by State of Texas / 38047”), kept readable with a short bottom gradient so the face stays clear. Years practicing sit below the media. The licensed credential (for example PsyD) is not repeated on that photo. From `md` up the photo has no name overlay: a see-through play control and, when a video is uploaded, a “Watch {FirstName}'s intro” pill. The name, credential line (licensed dropdown plus additional credentials), license lines, and years (when a start date is saved) sit in the card under the photo. Below `md`, below the education and credentials box, a titled Approach in Therapy box sits directly above a titled Areas of Interest section; each is omitted when that therapist has no labels. Stored modality tags stay as saved. A bare acronym renders as the full name with the acronym in parentheses (Cognitive Behavioral Therapy (CBT), Dialectical Behavior Therapy (DBT), Eye Movement Desensitization and Reprocessing (EMDR), Acceptance and Commitment Therapy (ACT), plus IFS and SFBT); a phrase already written out stays as stored. The play control stays on the video and stays see-through (transparent fill, light outline and icon, no blur). The owning therapist sees **Edit** (header, top right) and updates the same fields as join. Sliding scale, when offered, shows on the public profile (a previously saved range if one is still stored, otherwise “Available”). Find cards do not show it. The public profile does not show Insurance or Cash pay fee summary cards above the contact buttons. Session format, the office address, rates, sliding scale, in-network plans, and superbill stay on the profile. Below `md` they sit in the box titled “How {FirstName} works” (“works” in clay italic; no he or his). From `md` up those rows sit in the name card (format pills above the buttons; an Office row when an address is saved), and “How {FirstName} works” heads one card: Areas of Interest (filled navy pills), Approach in Therapy (outlined pills), then education and credentials. Format is separate pills (“In person” and “Virtual” when both are offered). The address (street, optional second line, state, and zip) shows when in-person and `locations.address` is non-blank; virtual-only and a blank street do not render an address. Free Consult and Book a Session open the listed contact. Below the `md` breakpoint (768px) those buttons pin to the bottom of the screen, including the safe-area inset, and the page pads so content is not covered. At `md` and wider they stay in the page flow, stacked full width in the name card (Book a Session, then Free Consult). One set is visible. Below `md`, the page is one column. The lead card is the photo and intro video together: name and license overlaid, see-through play control, years under the media. Under that card: education and credentials, Approach in Therapy above areas of interest, then the “How {FirstName} works” box. Next are the “Get to know …” conversation cards (small plain label, large serif answer), then “In {FirstName}'s own words” (possessive always ’s, accent on “words”) and the Profile/Reviews switch (one section at a time). From `md` up the page is two columns. Left: video card, name card, “How {FirstName} works”. Right: “Get to know {FirstName}” (name in clay italic) and “Honest answers, before you ever say hello.”, conversation cards with a clay italic prompt and a navy serif answer, then “In {FirstName}'s own words”, the navy Profile/Reviews switch, and the about text (short first sentence as a serif lead, remaining paragraphs in sans). Find cards keep the italic clay prompt.
3. **Join as a therapist** — Supabase Auth + 4-step onboarding matching the prototype: basic info (name, license number, and state required; education and certificates optional; repeatable state-license rows) → **photo (required, 5MB; join and edit resize oversized photos in the browser) + intro video (optional, file up to 50MB, or an in-browser recording up to 90 seconds where the browser supports it)** → practice tags → cards + contact + optional product feedback. A non-empty note is stored on `feedback` and emailed to `chrislo5240@gmail.com` (text, time, `/join`, name, profile email, login email, profile id). Join finishes and opens the profile once that note is saved. The email is sent in the background after the response (one claim, Resend idempotency key, at most once). A failed send is logged on the server and leaves `notified_at` null. The therapist does not see that email or a retry, and opening the profile does not send it. Nothing walks older unsent rows yet. Returning therapists sign in from home (`/join?mode=signin`) and land on their profile. Edit uses the same photo and video step and does not show the feedback box. Completing join writes `listed` true and `open_to_new_clients` from the form (omitted means open). Find and `/t/[id]` include that profile while both are true.
4. **Demo seeds removed from hosted data** — Maya Chen and the other accounts inserted by the seed migrations are deleted by `supabase/migrations/20260925043000_finish_demo_profile_removal.sql` (same rule in `20260925003000_remove_seed_demo_profiles.sql`). Delete only when `auth.users.id` **and** `lower(email)` both match that seed list (`*@kitchensink.demo`). Any other signup stays. Storage object rows are not deleted in SQL (hosted `storage.protect_delete`); ownership is cleared and bytes go away through the Storage API. New profiles cannot reuse those ids or that email domain, so a later migrate does not put the fakes back. Search lists therapists who completed join, are open to new clients, and are listed.
5. **Fast match** — one Postgres query, indexed. No N+1. See Matching.
6. **CI** — typecheck + lint + tests on every PR. Preview deploy.
7. **Admin helper upload** — `/admin/media`. An ops admin signs in, picks a therapist (including not open to new clients), and uploads a photo and/or intro video into that therapist's existing storage prefix. Same buckets, mime types, and size limits as join. Only `photo_key` or `video_key` changes. This stays the backup when the therapist's browser cannot resize a photo or record a video. No shared ops password is seeded. Create the Auth user in the Dashboard, then grant `admin` with SQL.
8. **Discoverability** — `/robots.txt` allows search crawlers and these AI user-agents: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended. It disallows `/admin` only. `/sitemap.xml` lists `/`, `/find`, `/join`, and therapists who are open to new clients and listed. `/llms.txt` is a plain-language summary of the product. Public pages set a canonical URL on `https://kitchen-sink-tau.vercel.app` (override with `SITE_URL`).
9. **Delete own profile** — On edit profile (`/join?edit=1`), the signed-in therapist deletes that profile from a danger zone under the form. A dialog requires typing `DELETE`. The public page leaves Find and `/t/[id]`. The profile delete cascades therapist-owned rows: licenses, rates, sliding scale, qualifications, tags, conversation cards, location, feedback, and reviews about them. Photo and intro video objects are removed with the Storage API. The auth user stays, so they can join again. Patients, admins, and other therapists cannot delete it. Afterward they land on `/profile-deleted`.
10. **Admin test profile** — An admin stays `admin` and can open Join to publish one therapist profile on that same account (for testing signup). Submitting Join again replaces that profile, including a leftover therapist row, and keeps `listed` (a hold row restored on insert). Admin Join does not create an unlisted profile on its own; it only keeps a flag that was already false. Public Find and `/t/[id]` show it when open to new clients and listed. A signed-in admin also sees unlisted open profiles on Find and `/t/[id]`, marked “Admin only — hidden from public”. Visitors, patients, and other therapists still get the not-found state on someone else's unlisted profile. The signed-in owner (admin or therapist) opens their own `/t/[id]` from My profile, with Edit, even when that profile is unlisted or closed to new clients. Find and the sitemap still omit it. The sitemap stays listed-only. Uploads (`/admin/media`) can hide or show any therapist profile (`admin_set_therapist_listed`). Hiding leaves the account and role in place. `20260925153000_therapist_directory_listing.sql` sets `listed` false for the Christine Lo and Matt Kirby profiles that were already on Find (id + email + name). Every other therapist stays listed. `20261007214457_admin_sees_unlisted_directory.sql` lets `private.is_admin()` include those rows in `search_therapists` and read the unlisted practice rows (rates, licenses, location, tags, cards, qualifications). Feedback stays owner-only. This is not a second login and not a multi-profile directory. A therapist or patient account still cannot join twice. The delete control stays on a therapist edit screen only.
11. **Review moderation** — A client or admin sees a personal-health-information warning on review signup and on the review form. Signup asks for email and password only. A new review, including one an admin writes on another profile, is `pending` and is not on the public profile. An admin approves it at `/admin/reviews` or rejects it. Reject, and the author's Remove, hard-delete the row. Nothing archives the rejected text. Reviews have no storage objects. Rows that already existed when this shipped stay `approved`. The form does not collect session length or how long the client saw the therapist; a signed-in save clears those leftover columns.
12. **Forgot password** — Therapist sign-in (`/join?mode=signin`), client review sign-in, and admin sign-in (`/admin/media` and `/admin/reviews`) link to `/forgot-password`. The person enters an email. Supabase Auth sends a reset link. The screen says the same thing whether or not that email has an account. `/reset-password` sets a new password (min 6) for therapist, patient, and admin email/password accounts, then leaves them signed in. Hosted Auth must allow `{origin}/reset-password` as a redirect URL (local `config.toml` already does). The default recovery email works when the link is opened in the same browser; `supabase/templates/recovery.html` uses `token_hash` so a link also works from another device once that template is the one Auth sends.
13. **Client accounts are for reviews only** — Sign up or sign in on a therapist profile to leave a review. The client profile stores the login email and the name `Patient`. It does not store phone, about, photo, video, tags, location, or feedback, and it cannot upload a photo or video. Find does not attach a search to that account. `20260928131234_client_review_accounts_only.sql`.
14. **Admin view switcher** — A signed-in admin can preview Admin, Therapist, or Client from a header control. The same control stays on profile, join, and password pages so they can switch back. The choice is the `ks_view` cookie until they change it. Non-admins never see the control. Therapist view uses therapist nav (My profile when they have one, Sign out, no Uploads or Reviews). Find hides unlisted profiles and the admin-only badge. My profile still opens that owner's page. Client view uses the public nav plus Sign out. Find shows only a public listing, and a hidden profile — including the admin's own — reads as not found. Uploads and the review queue render only in Admin view. The cookie does not change `role`, RLS, or admin RPCs. It can only hide admin-only rows.

## Not built yet (backlog, allowed)

These existed as hackathon cuts. They are **in play** whenever we take them on. Update this doc when one ships.

- Booking, calendars, payments; “Free Consult” / “Book a Session” as real scheduling. Today those buttons `mailto:` / `tel:` listed contact.
- Patient onboarding, public patient profiles, stored patient location, saved searches, and health intake. Client accounts stay for reviews only. Seed reviews still use patient `profiles` rows.
- Video transcoding, multiple intro clips, a video CMS. Today: one clip per therapist, stored as uploaded, native `<video>`.
- Maps, geocoding, distance search. If in-person is selected, **store** location. Search uses license state, not lat/lon.
- Messaging, likes/hearts chrome, realtime. Ops helper upload is shipped (`/admin/media`). Review approve/reject is shipped (`/admin/reviews`).
- Supervisor license **verification** (no legal review). Associate/trainee credentials are not offered.

Patient tables stay in the schema. Expand patient UI when the product needs it.

## Screens (visual source of truth)

Prototype PNGs live in `prototype_screenshots/`. Index: `prototype_screenshots/README.md`. Screenshots win on layout; this file wins on behavior.

| Flow | What it is |
| --- | --- |
| Home | Public landing. Eyebrow “Kitchen Sink”. Headline “Bring everything. And the kitchen sink.” Subhead: bring everything — and the kitchen sink — to session. Toggle defaults to “Therapist who is ready to connect”: card “Meet clients who are ready to bring it all.” with only Create a profile (`/join`) and Log in (`/join?mode=signin`), including when a therapist or admin is signed in. “Connect with a Therapist”: card “Find a therapist who Gets You.” with the find CTA (`/find`). Below that card, a navy band: envelope + “From the newsletter”, heading “Why Kitchen Sink?” (`Kitchen Sink?` in clay italic), “The story behind the name and our Why.” Clay pill “Read the story” opens the Why article (`https://everythingbutkitchensink.beehiiv.com/p/two-feet-in-the-kitchen-sink-5219f599263b7fcd`). Underlined “Subscribe to the newsletter” opens `https://everythingbutkitchensink.beehiiv.com/`. Both use a new tab (`rel="noopener noreferrer"`). |
| Nav | Home, Find a Therapist, For Therapists (`/join`), Why Kitchen Sink? (the newsletter Why article, new tab), then a divider and Therapist log in (`/join?mode=signin`). The Why link stays for signed-in therapists, admins, and client preview. Signed-in therapists see My profile and Sign out instead of For Therapists and Therapist log in. Signed-in admins see Uploads, Reviews, and For Therapists, plus a view switcher (Admin view / Therapist view / Client view). If that admin has a therapist profile, My profile opens it at `/t/{their id}` (same owner view as a therapist, including Edit). An admin with no therapist profile does not see My profile; For Therapists stays. Therapist preview matches a therapist header and still opens that owner's page, without the admin-only badge. Client preview matches the public header plus Sign out, and a hidden profile reads as not found. The switcher stays visible either way. |
| Therapist onboarding 1 | **Name (required)**, licensed credential dropdown, years practicing, **Education (optional)**, **Credentials & certificates (optional)**, **State license(s)** (min 1; license # and state both required on each kept row; blank extra rows ignored) |
| Therapist onboarding 2 | Photo (required; oversized photos resized in the browser) + intro video (optional, up to 50MB file, or up to 90s recorded in the browser where supported; profile hero plays intro when present) |
| Therapist onboarding 3 | Open to new clients, virtual / in-person, specialties, headed “Areas of Interest” (the same preset chips as Find; no free-text add; a specialty already stored outside that list stays selected so a save does not drop it), Approach in Therapy (heading; preset chips + “Add your own”; a bare acronym shows the full name, e.g. Cognitive Behavioral Therapy (CBT); the saved tag stays the chip value) / insurance (preset chips + “Add your own”), identity (tags) |
| Therapist onboarding 4 | **Rates** repeater (service type + session length in minutes + price, remove row, “+ Add another rate”), **Offer sliding scale** checkbox, conversation cards (min 3, max 6), about, private email, outreach (email / phone / text), optional feedback (emailed to the team on submit) |
| Search | Centered like home: large serif headline, filters in one paper card (serif clay titles, shared tag pills, pill state field), each result that same paper card. Must-have chips. Specialty group heading is “What brings you to therapy?” (preset chips only). From `md` up the result is the wide card: tall left portrait, “Watch {first}'s intro” pill, large serif name, credential line (“PsyD · Licensed Psychologist”), Virtual / In-Person pills, first conversation card (clay italic prompt, large serif answer), outlined matching specialty and insurance pills, overlap count, navy “Get to know {first} →”. No cost, rate, price, or sliding scale. Below `md`: photo/initials, name, credential, years, format chips, matching tags, see-through play control on a 9:16 frame when there is a video. First conversation card in saved order, or nothing if they have none |
| Profile | Same site header as the rest of the site (sparkle wordmark and nav; the admin view switcher stays in that header). From `md` up, two columns. Left: photo and intro video (see-through play control, “Watch {FirstName}'s intro” when a video exists, no name overlay) and a name card (name, credential line, license lines, years when saved, In person / Virtual pills, Book a Session then Free Consult, then rates, sliding scale, in-network, out-of-network, and Office when an address is saved). Under that, “How {FirstName} works” (clay italic “works”) heads Areas of Interest, Approach in Therapy (full names, e.g. Cognitive Behavioral Therapy (CBT)), education, and credentials. Right: “Get to know {FirstName}”, conversation cards (clay italic prompt, navy serif answer), “In {FirstName}'s own words”, the navy Profile/Reviews switch, about (serif lead, sans paragraphs), and reviews. Headings use the first name, never he or his. No Insurance or Cash pay fee summary cards above contact. Free Consult is the shared white secondary pill; Book a Session is the clay primary pill. They pin to the bottom below `md` and stay in flow from `md` up. Profile and Reviews use the navy switch. Below `md`: the photo and intro video share one lead card (name and license overlaid, see-through play control). Education, Approach in Therapy, areas of interest, and the “How {FirstName} works” box sit under that card. “Get to know …” cards keep the small plain label and large serif answer. “In {FirstName}'s own words” sits above the Profile/Reviews switch. The phone column does not switch to the desktop cards. |
| Therapist not found | Same site header and homepage card when `/t/[id]` has no available profile. Eyebrow “Therapist profile”. Title “We couldn't find that therapist.” Note: they may have closed their practice to new clients, be hidden from Find, or the link is out of date. Back to search. |
| Unknown address | No About page and no standalone feedback page. `/about`, `/feedback`, and any other unknown URL use the site header and the homepage card. Eyebrow “404”. Title “This page could not be found.” Home goes to `/`. |
| Delete profile | Edit profile only (`/join?edit=1`), under the form. Dialog requires typing `DELETE`. Then `/profile-deleted` (site header, homepage card). |

Match visual tone: cream page, navy type, terracotta buttons, rounded cards, serif headlines, no footer. Shared pieces in `components/ui` are the one set: clay primary pill and white secondary pill (thin ink border, same height), one paper card (homepage radius and shadow), one tag pill, a navy segmented switch (the header view switcher is the same control, smaller), pill fields for short text and a rounded box for long text, sentence-case labels (serif clay eyebrow, no tiny capitals). Find and the public therapist profile both use that set. Sign-in, forgot password, reset password, admin sign-in, the patient account screen, profile-deleted, an unknown address, and a missing therapist profile keep the site header and sit in that card, centered. Join steps and edit profile (`/join?edit=1`) still hide the site header (an admin still gets only the view switcher) and keep the step bar: back, dots, close. Each step sits on the cream page in the paper card, with a centered serif title and clay serif eyebrow. Fields, tags, add actions, and delete use the shared pills; the open-to-new-clients toggle is the navy switch. About, conversation-card answers, and the optional feedback note use the rounded box. Edit hides that note. The client review sign-in uses the shared fields, switch, and button. Admin lists (`/admin/media`, `/admin/reviews`) stay dense on the cream page: clay serif title, therapist rows in one paper card, one paper card per pending review, tag pills for status (including Pending on each queued review), and clay primary plus white secondary pills for actions.

Rates appear on the profile only. They are **not** in the original data notes. Store in `rates` (1:n per therapist). Find cards do not show price, duration, or sliding scale. The profile shows every rate row and sliding scale when offered.

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
  listed bool default true          -- false: omit from public Find, sitemap, and /t/[id]. A signed-in admin still sees it on Find and /t/[id]
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
  id, profile_id, kind, label   -- label = preset chip, or a custom modality/insurance label; a specialty outside the Find list may already be stored
  kind: specialty | modality | identity | insurance | outreach
  unique (profile_id, kind, label)

profile_items                   -- conversation cards; 3–6 rows per therapist
  id, therapist_id, prompt, answer, tag, position
  position int                -- saved order; lower is first. Insert assigns it when omitted
  tag: approach | session_vibe | specialty | about | outcome | custom

feedback
  id, profile_id, body, created_at
  notified_at timestamptz          -- claim for the background ops email; cleared if that send fails. Profile views do not send it. Rows from before the column are marked so they are not emailed later.

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

Suggested labels (preset chips; therapist may also add custom labels for modality and insurance):

- Credentials (fixed dropdown only): LMFT, LCSW, LPC, PsyD, PhD, MD. Shown on search cards. The public profile does not repeat that label under the photo.
- Education and additional credentials (freeform, optional, 0–n): separate repeaters on join/edit. Stored in `qualifications`, not `tags`. Not used by search.
- Rate service types (fixed): Individual, Couples, Family, Group
- Rate session length: free-text whole minutes, 1–480. Shown as “50 min”.
- Specialties (Find list only — `SPECIALTY_PRESETS`; public profile and the join picker use this list): Anxiety, Depression, Trauma & PTSD, Couples & Relationships, ADHD, Grief & Loss, Life Transitions, Self Discovery, Immigration. Find heads this group “What brings you to therapy?”. Therapist join and the public profile head this group “Areas of Interest.” A specialty tag stored as Teens matches the Self Discovery filter and is shown as Self Discovery; the next profile save stores Self Discovery. Any other specialty already stored outside this list stays in `tags` and is not shown on the public profile.
- Approach in Therapy (stored `modality` presets + custom): CBT, DBT, EMDR, Psychodynamic, ACT, Somatic, Narrative, Attachment-Based. Public profile and join/edit heading is Approach in Therapy. Display expands bare CBT, DBT, EMDR, ACT, IFS, and SFBT to the full name with the acronym in parentheses. Other phrases stay as stored. Saves still write the chip value, not the display string.
- Insurance (preset + custom): Aetna, BCBS, Cigna, Optum, Cash Pay Only, Out-of-Network Superbill
- Outreach (fixed): email, phone, text

**Custom tags:** onboarding shows preset chips plus free-text “Add your own” for modalities and insurance. Specialties are the Find preset chips only — no free-text add. Teens is the previous name of Self Discovery, so Find, the public profile, and the join editor treat a stored Teens tag as Self Discovery, and a save stores Self Discovery. Any other specialty already stored outside that list stays in `tags` on save (the editor still shows it selected) and is not shown on the public profile. Trim whitespace; store custom modality and insurance labels in `tags` like presets and show them on the profile. Modality display uses the shared label helper; the stored label does not change. Patient search specialties are the preset chips only. Insurance search stays preset-only unless we expand it. Query tags outside the specialty and insurance presets are ignored.

Identity tags: small fixed set in onboarding; not a search must-have today.

**In-person rule:** if `in_person_practice` (therapist) is true, a location row must exist. The public profile shows that office address (street, optional second line, state, and zip) when the street is non-blank. Below `md` it sits in the “How {FirstName} works” box. From `md` up it is the Office row on the name card. Session format is separate “In person” and “Virtual” pills when both are offered, otherwise the one offered. Virtual-only profiles, and in-person profiles with a blank street, do not render an address. Patient in-person is a search toggle, not a stored patient location. Find does not save filters. A client profile cannot store phone, about, photo, video, tags, location, or feedback, and cannot upload a photo or video. Practice writes stay on therapist and admin accounts.

RLS: public can `select` therapists who are `open_to_new_clients` and `listed`, including an admin test profile (`role` stays `admin`). A signed-in admin can also `select` an open, unlisted therapist's practice rows (rates, licenses, location, tags, cards, qualifications) so Find and `/t/[id]` can render that profile. Feedback stays owner-only. A therapist or admin can insert and update their practice rows. A patient can insert only a review account (login email and the name `Patient`) and cannot update that profile or write tags, location, feedback, or other practice rows. A therapist cannot change `listed`. Reviews: public read of `approved` rows for open, listed therapists; the author can read their own pending row; a signed-in patient or admin inserts and updates their own row on an open, listed therapist (that write stays `pending`; role stays put; a therapist cannot review; an admin cannot review their own profile); the author or an admin hard-deletes it. An admin can read the queue and set `status` to `approved`. Reject does not keep a copy. Feedback insert by the therapist or admin. That same user can claim their own fresh row for the ops email and clear the claim if the send fails. Storage: public read for photos and intro videos; a therapist writes only their own prefix (`photos/{uid}/`, `videos/{uid}/`). A patient cannot upload. An admin may also write those buckets under an existing therapist id, which is what `/admin/media` uses. The search card query returns `video_key` and the first conversation card (`profile_items.position`). Find does not request the video file until play. There is no profiles DELETE policy. `delete_own_therapist_profile('DELETE')` is the delete path: `auth.uid()` must own a therapist profile. It does not delete `auth.users` or any other profile. Child rows cascade, including reviews about that therapist. Storage bytes are removed with the Storage API, not SQL.

**Admin role.** `admin` is ops. The same account can also hold one therapist profile so ops can test Join. Role stays `admin` (the public page shows that profile when it is open to new clients and listed; a signed-in admin also sees it when it is unlisted; My profile opens the owner's own page either way). `admin_set_therapist_listed(therapist_id, listed)` shows or hides one profile. It does not delete the account or change role. An admin can leave one review on another open, listed therapist profile. That does not change `role`. The review stays pending until an admin approves it. They cannot review their own test profile. An API session cannot insert `role = admin` or change its own role (`auth.uid()` is set). Dashboard SQL with no user JWT can. Admins can read therapist profiles and call `admin_set_therapist_media(therapist_id, kind, key)` to set `photo_key` or `video_key` only. There is no seeded ops login. Create the Auth user in the Dashboard (Authentication → Users, email confirmed), then grant `role = admin` with Dashboard SQL. Never commit a password. `20260925170000_remove_seeded_ops_admin.sql` deletes the old seed only when its auth id and `ops@example.com` both still match, demotes a leftover admin profile with that same id and email, and rejects a later insert of that profile. `@kitchensink.demo` is still rejected for new profiles.

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

Access pattern: therapists whose tags **overlap** the patient’s selected tags (match at least one), plus session format and license state when selected. Rank by overlap count, then name. Return `match_count` + `matched_labels` from the same RPC. Cards use the active filters (not a highlight) to list only overlapping specialty and insurance labels; a group with no selected filter shows no chips. The overlap line still reads “3 of 4 tags”.

One RPC or one query. Do not load all therapists and filter in JS. Changing to AND, geo, or pagination should stay one SQL round trip.

```sql
-- tag OR: therapist tags && selected tags (overlap — match at least one)
-- rank: match_count desc, name asc
-- also: open_to_new_clients and listed (signed-in admin also gets listed = false)
-- session format: virtual_practice and/or in_person_practice
-- license state: exists licenses.state = selected
```

Indexes (required, this is the performance story):

- `tags (profile_id, kind, label)` unique
- `tags (kind, label, profile_id)` for reverse lookup
- `licenses (therapist_id)`, `licenses (state)`
- `rates (therapist_id)`
- `profile_items (therapist_id, position)` for the first conversation card on a Find card
- partial index on `therapists (profile_id) where open_to_new_clients`
- partial index on `therapists (profile_id) where open_to_new_clients and listed`
- optional denormalized `therapists.specialty_labels text[]` with GIN if the join is slower in explain. Prefer the array if we touch matching twice.

Return search cards in **one round trip** (join photo URL, credential, years, a few tags). The query may still return min rate, duration, and the sliding scale flag; Find cards do not render them. It also returns `video_key` and the first conversation card by `position`. Cap page size (24). No unbounded select.

## Stack

- Next.js App Router, TypeScript, Tailwind
- `@supabase/ssr` + `@supabase/supabase-js`
- Supabase hosted Postgres + Auth + Storage
- Vercel

App routes: `/` home, `/find` search, `/t/[id]` profile, `/join` therapist onboarding (auth gated), `/forgot-password` and `/reset-password` (email reset; not indexed), `/profile-deleted` after a therapist deletes their profile, `/admin/media` ops helper upload (auth + admin role), `/admin/reviews` pending review queue (auth + admin role). `/matches` redirects home. Unknown URLs, including `/about` and `/feedback`, render the 404 card. `/robots.txt`, `/sitemap.xml`, and `/llms.txt` are public discoverability files.

## Performance

- Match query < 50ms on a small directory; write an `explain analyze` fixture test or SQL comment with the plan.
- Indexes on every FK and every WHERE/JOIN column used by search.
- RLS policies wrap `auth.uid()` in `(select auth.uid())`.
- Images via Supabase public URL; next/image if it is free, skip if it fights Storage. Find shows an intro-video poster and loads the file only after play (`preload="none"`, no `src` until then). The profile hero still plays the same clip. Video via public Storage URL + native `<video>`; no transcoding today.
- No ORM waterfall. Server components fetch; no client waterfall of sequential supabase calls.

## CI / CD

Goal: merge to `main` is production.

1. GitHub Actions: `npm ci`, `tsc`, lint, unit tests (match query + UI tests).
2. Vercel: preview on PR, production on `main`.
3. Migrations live in `supabase/migrations/`. Apply to the linked project from CI or a documented one-liner. Do not click-ops schema.

Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `RESEND_API_KEY` (Join feedback email). Optional `RESEND_FROM` (verified sender; default is Resend's onboarding address). Never commit service role. Never expose service role or the Resend key to the browser.

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

Hosted `/find` lists therapists who completed join, are open to new clients, and are listed. The Maya Chen walkthrough was demo seed data; it is not on the hosted database after the removal migration. A signed-in patient or admin can submit a review on an open, listed profile; it stays pending until an admin approves it. A new therapist can join with a photo (intro video optional). Join sets `listed` true, so they show up in search while open to new clients. An admin re-join keeps a previous `listed` false (Christine Lo and Matt Kirby stay hidden from the public; a signed-in admin still sees them). CI is green. Match is one indexed query.
