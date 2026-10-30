# Product decisions

Christine's asks that are live in the product today. Each one has a guard test. Those tests are the lock. Browser checks in `tests/guards/browser/` are guard tests too. They run in the `e2e` job against the test Supabase project, at a phone width and a desktop width.

A pull request that edits this file, or deletes, skips, or weakens a file in `tests/guards/`, fails CI unless the PR has the label `product-decision-approved`. Adding a new ask to this list is an edit and needs that label too. Create the label once in the GitHub repo before you need it.

Coding agents: do not delete, skip, or rewrite a guard test to make CI pass. Do not drop a row from this file so the checker goes quiet. If a new ask conflicts with one below, stop. Name the conflict in the PR description and wait for the label. Pending and already-replaced asks are not bugs. Do not build them back.

The checker itself is `scripts/check-product-guards.mjs`. CI runs the copy from the base branch, so editing the checker in the same PR does not turn it off. Changing the checker needs the same label.

Releases: a successful production deploy hook on `main` tags `release-YYYY-MM-DD-N` and opens a GitHub Release. How to roll back: [rollback.md](rollback.md).

## Live

### Find filters are four pills, and the phone row wraps

Where you live, Insurance, What's going on, In person or online. Same order on the phone and on desktop. A phone wraps the pills so none are cut off and the row does not scroll sideways. There is no years-in-practice filter.

- Landed: 2026-10-21, #114. Phone sheet 2026-10-22, #115. Wrapping pills 2026-10-22, #119.
- Guard: `tests/guards/find-filters.test.tsx`
- Browser: `tests/guards/browser/find-filters.test.ts`

### What's going on is twelve plain-language topics, plus Other

The pill opens "What would you like help with?" The line under it says you don't need the clinical term; it's in small print. Under the list: "Pick as many as you like. You can change these anytime." The topics, in order, are Feeling down or stuck (Depression), Worry, stress or panic (Anxiety, panic disorder), Something hard happened (Trauma, PTSD), Losing someone (Grief and loss), Relationship trouble (Couples, relationship issues), Big life changes (Life transitions), Seeking personal growth (Self-discovery, self-awareness), Trouble focusing (ADHD), Understanding my moods (Bipolar disorder, mood disorders), My relationship with food or my body (Eating disorders, body image), Autism & how my brain works (Autism, neurodivergence), and Testing or getting an evaluation (Psychological testing, diagnostic assessment), then Other (small print: Another specialty). Each chip filters on the stored specialty a therapist can pick in Join: Depression, Anxiety, Trauma & PTSD, Grief & Loss, Couples & Relationships, Life Transitions, Self Discovery, ADHD, Bipolar & Mood Disorders, Eating Disorders & Body Image, Autism & Neurodivergence, and Psychological Testing & Assessment. The button says Show N therapists. The phone sheet has Clear all. Immigration shows only when that tag is already in the address, so it can be cleared. Self Discovery is a normal topic. Topics with no stored specialty (family, burnout, substances) are not offered as named chips. Other matches a therapist who has at least one specialty that is not one of those twelve — Immigration, a custom label, or the literal specialty Other. A named topic and Other are OR. The address marker is `Other topic`, so it stays independent of insurance Other. Join does not gain an Other chip. The referral board keeps its existing focus-area list.

- Landed: 2026-10-21, #114. Phone copy 2026-10-22, #115. Other 2026-10-26. Twelve topics 2026-10-30.
- Guard: `tests/guards/find-filters.test.tsx`
- Browser: `tests/guards/browser/find-filters.test.ts`

### Insurance includes Other

The insurance sheet and the desktop insurance menu list Aetna, BCBS, Cigna, Optum, Cash Pay Only, and Out-of-Network Superbill, then Other. Other matches a therapist who has at least one insurance label that is not one of those presets, or the literal insurance Other. A named plan and Other are OR. The address marker is `Other`. Join keeps the preset list and does not add an Other chip.

- Landed: 2026-10-26.
- Guard: `tests/guards/find-filters.test.tsx`
- Browser: `tests/guards/browser/find-filters.test.ts`

### Desktop Find is a grid of eight

The default is a grid, two columns, four from the wide breakpoint. The line is "{N} therapists fit what you told us · Click anyone to see their full profile." Grid and One at a time sit on that line. Show 8 more loads the next eight, and the label names the real remainder when fewer are left.

- Landed: 2026-10-22, #116.
- Guard: `tests/guards/find-cards.test.tsx`
- Browser: `tests/guards/browser/find-cards.test.ts`

### A Find card has no price, no specialty pills, and no match count

Grid and one-at-a-time cards show the photo or intro, the format, the name, the credential line (PsyD · Licensed psychologist), one conversation card, Takes {plan} when they take a plan, and years in practice. They do not show a price, a rate, sliding scale, specialty pills, or "3 of 4 tags". The opened Find detail and the public profile still show fees.

- Landed: no price 2026-10-07, #60. This card shape 2026-10-22, #116 and #118.
- Guard: `tests/guards/find-cards.test.tsx`
- Browser: `tests/guards/browser/find-cards.test.ts`

### One at a time uses that same card

Desktop one-at-a-time is the grid card, one at a time, with "Therapist n of N who fit what you told us". It does not say Get to know, Can help with, or show a neighbor peeking in.

- Landed: 2026-10-22, #118.
- Guard: `tests/guards/find-cards.test.tsx`
- Browser: `tests/guards/browser/find-cards.test.ts`

### Opening a desktop card stays on Find

The detail shows the name, Watch intro when a video is saved, the conversation cards, the facts, and the public intake that was saved (areas of interest, approach, fees, about). All matches goes back to the grid. Next therapist stays. Book a session and Book a free 15-min consult open the contact sheet. They are not mail or phone links.

- Landed: 2026-10-22, #116, #117, and #120.
- Guard: `tests/guards/find-detail.test.tsx`
- Browser: `tests/guards/browser/find-detail.test.ts`

### The phone Find page lists, and can switch to one at a time

The headline is "Find your therapist". Under the pills: "{N} therapists fit" and List / One at a time. List is the default.

- Landed: 2026-10-22, #115.
- Guard: `tests/guards/phone-find.test.tsx`
- Browser: `tests/guards/browser/phone-find.test.ts`

### A phone list card with a photo is a tall frame

The frame is 4:5. In person · Online sits on it. The name and credential sit on the photo. Below: "I work best with..." and the answer. Play stays in the frame. The card does not show a price, specialty pills, Takes {plan}, years, or a match count.

- Landed: 2026-10-08, #88. Vertical intro 2026-10-22, #122.
- Guard: `tests/guards/phone-find.test.tsx`
- Browser: `tests/guards/browser/phone-find.test.ts`

### A phone list card with no photo and no video is the initials card

Initials, In person · Online, the name, the credential, the first conversation card, Takes {plan}, and years. Still no price.

- Landed: 2026-10-22, #115.
- Guard: `tests/guards/phone-find.test.tsx`

### Phone one-at-a-time swipes the Find set

All N, n of N, a one-time "Swipe for the next therapist", and a preview of the next person ("Swipe for n of N"). That chrome is phone-only. The public profile page is the Find detail layout at both widths. Find's phone one-at-a-time stack still uses the phone profile column inside the swipe.

- Landed: 2026-10-22, #121. Public page moved to the Find detail 2026-10-30.
- Guard: `tests/guards/phone-find.test.tsx`
- Browser: `tests/guards/browser/phone-find.test.ts`

### The public profile uses the Find detail frame

`/t/{id}` uses the same opened Find detail on the phone and on desktop. The uploaded photo is the 4:5 stage (object-fit cover). A saved video shows "Watch intro" on that frame. The video file waits until play when a photo is saved. A video with no photo uses one frame of the file. There is no "1 min intro" badge and no separate later portrait. The name and credential line (PsyD · Licensed psychologist) sit above the stage. License lines sit in the facts card (`Licensed in Texas (#38047)`). Find directory cards still use a see-through play control.

- Landed: 2026-10-30. Replaces the later-frame photo (2026-10-29) and the separate phone and desktop profile layouts.
- Guard: `tests/guards/profile.test.tsx`
- Browser: `tests/guards/browser/profile.test.ts`

### Profile sections follow the Find detail, on the phone and on desktop

One layout (`data-profile-layout="one"`). Facts card: formats, years, license, education, credentials, address, insurance. Then "How {name} works" when specialties or modalities exist: Areas of interest, then Approach in therapy. Then fees. Then In {name}'s own words, the Profile/Reviews switch, conversation cards, and reviews. There is no "Get to know {name}" heading. Education and credentials are not their own sections. Identity tags are not on this page. Approach spells out a bare acronym (Cognitive behavioral therapy (CBT)). Tag pills wrap. Free consult stays left of Book a session. Edit, Delete, the draft badge, and the admin Hidden (admin only) toggle stay on the profile.

- Landed: 2026-10-30.
- Guard: `tests/guards/profile.test.tsx`
- Browser: `tests/guards/browser/profile.test.ts`

### Hidden means admin-only on the public profile

`listed` false omits the profile from public Find. On `/t/{id}` only the owner and a signed-in admin in Admin view can open it, including when the practice is closed. Everyone else gets the normal not-found, including an admin in Client or Therapist view. A listed practice that is closed to new clients stays owner-only. Admin view shows a "Hidden (admin only)" toggle that calls `admin_set_therapist_listed`. An owner Save changes or Publish on an existing row does not set `listed` back to true.

- Landed: 2026-10-30.
- Guard: `tests/guards/profile.test.tsx`

### Book and Free consult open a contact sheet

The buttons say Free consult and Book a session. Free consult is on the left and Book a session is on the right, on the phone dock and in the desktop name card. On the phone they pin to the bottom. They open "Reach {name}" and say Kitchen Sink doesn't book sessions. Only Email, Call, and Text leave the site.

- Landed: pinned buttons 2026-10-07, #59. Sheet 2026-10-22, #120. Left/right order 2026-10-26.
- Guard: `tests/guards/profile.test.tsx`
- Browser: `tests/guards/browser/profile.test.ts`

### Education and credentials sit in the facts card

On every public profile, phone and desktop, and on the Find detail, education and credentials are rows in the facts card. They sit under the license line and above insurance. They are not their own Education or Credentials sections. An empty list is omitted. The rows use the same line treatment as the other facts in that card.

- Landed: 2026-10-26.
- Guard: `tests/guards/profile.test.tsx` and `tests/guards/find-detail.test.tsx`
- Browser: `tests/guards/browser/profile.test.ts` and `tests/guards/browser/find-detail.test.ts`

### Travis White's public profile hides education

The public profile and the Find detail omit education for profile id `3b354f1e-50a1-4a17-b536-cc7fce1296fe` (`TRAVIS_PROFILE_ID` in `scripts/travis-white/profile.mjs`), on the phone and on desktop. Other therapists still show education. His credentials still show when they are saved. Join, edit, and the stored qualifications are unchanged.

- Landed: 2026-10-26.
- Guard: `tests/guards/profile.test.tsx` and `tests/guards/find-detail.test.tsx`

### Identity tags stay off the public profile

Identity labels (BIPOC, LGBTQIA+, and any other saved identity tag) are not shown on `/t/[id]` or the Find detail. Join and edit still collect them. Nothing is removed from the tags table.

- Landed: 2026-10-26.
- Guard: `tests/guards/profile.test.tsx` and `tests/guards/find-detail.test.tsx`
- Browser: `tests/guards/browser/profile.test.ts` and `tests/guards/browser/find-detail.test.ts`

### Free consult is on the left and Book a session is on the right

The profile buttons say Free consult and Book a session. Free consult is the left button. Book a session is the right button. The phone dock and the desktop name card use that same order. They still open the contact sheet.

- Landed: 2026-10-26.
- Guard: `tests/guards/profile.test.tsx`
- Browser: `tests/guards/browser/profile.test.ts`

### A closed practice says Not accepting new clients

One soft pill when they are not taking new clients. An open practice does not show it.

- Landed: 2026-10-19, #110.
- Guard: `tests/guards/profile.test.tsx`
- Browser: `tests/guards/browser/profile.test.ts`

### The owner can Edit and Delete from the profile

Edit and Delete sit with Back to search. A visitor does not see them.

- Landed: 2026-10-12, #94.
- Guard: `tests/guards/profile.test.tsx`
- Browser: `tests/guards/browser/profile.test.ts`

### Public type is Fraunces, DM Sans, and a Caprasimo wordmark

Page headings and conversation answers are Fraunces. Everything else is DM Sans. The header wordmark is Caprasimo with the gold sparkle, and that is the only Caprasimo.

- Landed: wordmark 2026-10-09, #92. Fraunces and DM Sans 2026-10-15, #104.
- Guard: `tests/guards/type.test.ts` and `tests/guards/home-nav.test.tsx`

### The homepage is the therapist start plus the find card

"Bring everything. And the kitchen sink." Then the for-therapists block (FOR THERAPISTS · FREE, Get my profile started, Build it myself from scratch, How it works). The find card says "Find a therapist who Gets You." No audience toggle, no "Meet clients who are ready to bring it all.", and no "actually fits". The therapist card does not link to admin tools.

- Landed: 2026-10-07, #45, #66, and #67. Heading 2026-10-08, #84.
- Guard: `tests/guards/home-nav.test.tsx`
- Browser: `tests/guards/browser/home-nav.test.ts`

### Homepage does not promote the Beehiiv newsletter

The homepage has no newsletter band, no "Why Kitchen Sink?" heading on the page body, and no Read the story or Subscribe links.

- Landed: 2026-10-26. Replaces the homepage band from #85 and #97.
- Guard: `tests/guards/home-nav.test.tsx`
- Browser: `tests/guards/browser/home-nav.test.ts`

### The header has no Why Kitchen Sink? link

The header does not include a Why Kitchen Sink? link for anyone, signed out or signed in. It does not open the Beehiiv story.

- Landed: 2026-10-26.
- Guard: `tests/guards/home-nav.test.tsx`
- Browser: `tests/guards/browser/home-nav.test.ts`

### Header links match who is signed in

Signed out: Home, Find a Therapist, For Therapists, Therapist log in. A published therapist sees Referrals. An unpublished therapist does not.

- Landed: For Therapists 2026-10-07, #45. Why link removed 2026-10-26. Referrals 2026-10-19, #109.
- Guard: `tests/guards/home-nav.test.tsx`
- Browser: `tests/guards/browser/home-nav.test.ts` (signed out). A published therapist's Referrals link is in `tests/guards/browser/profile.test.ts`.

### Join says Areas of Interest and can add a label

The join step heading is Areas of Interest, with Add your own. A custom label already stored stays selected. Approach in Therapy shows the full name for a bare acronym (Cognitive Behavioral Therapy (CBT)).

- Landed: heading 2026-10-08, #80. Custom labels 2026-10-12, #101. Approach names 2026-10-08, #82.
- Guard: `tests/guards/join.test.tsx`

### Publishing needs a picture plus a video or a voice prompt

A draft that is not live yet offers Save as draft, and Publish profile when that pair is attached. Without it, only Save as draft, plus "You need a picture, plus a short video or a voice prompt, to publish your profile." A live profile offers Save changes, not Save as draft.

- Landed: draft and publish buttons 2026-10-12, #96. Photo and video 2026-10-12, #99. Voice prompt counts 2026-10-14, #102.
- Guard: `tests/guards/join.test.tsx`

### The referral board explains itself

The intro is the caseload / better-fit paragraph. How it works starts open: post from the lists, Kitchen Sink approves it, therapists tap interested, follow up in your own mail, refresh after the week. Only a signed-in therapist with a published profile can see the board. Kitchen Sink stores no client name, email, or phone.

- Landed: the board 2026-10-19, #109. How it works 2026-10-20, #111. Intro 2026-10-20, #112.
- Guard: `tests/guards/referrals.test.tsx`

### The lock and the release tag

CI fails a PR that edits this file or weakens `tests/guards/` unless the label is set. A production deploy on main tags `release-YYYY-MM-DD-N` and opens a GitHub Release with generated notes.

- Landed: with this change.
- Guard: `tests/guards/policy.test.ts` and `tests/guards/release.test.ts`

## Pending decision

These three were live and then removed. Christine has not picked which version she wants. No guard test requires the old version. Do not restore them in passing. Bringing one back conflicts with a live guard above and needs the label.

- **What brings you to therapy?** The Oct 7 specialty filter, including Self Discovery and Immigration as normal options. #71, 2026-10-07. Replaced by What's going on and the seven topics, #114 and #115. Find Other (2026-10-26) is not this list.
- **Only the matching specialty and insurance pills on Find cards.** #61, 2026-10-07. #114 put the old card treatment back, and #116 / #118 removed the pills.
- **"3 of 4 tags" on Find cards.** The overlap count. Removed from the card in #114, 2026-10-21. The helper `overlapCopy` is still in the repo. The card does not show it.

## Already replaced

Later asks won. Do not treat these as unfinished work.

- Homepage Beehiiv band (Read the story / Subscribe) from #85/#97 was removed. The header Why Kitchen Sink? link (#85) was removed 2026-10-26.
- Homepage audience toggle and "Meet clients who are ready to bring it all." (#45). The page is the therapist-start block plus the Gets You card.
- "Find a therapist who actually fits." (#45). The card says Gets You (#84).
- Clay emphasis on "therapist" in the Find headline (#73). The headline is plain "Find your therapist" (#114).
- Desktop wide portrait Find card and "Get to know {first} →" (#72, #87). Replaced by the grid card (#116, #118).
- Phone Find opening as a sideways swipe (#113). List is the default (#115). Sideways swipe remains inside one-at-a-time.
- Public profile specialties limited to the Find preset list (#68). Custom areas of interest show on the profile again (#101).
- Caprasimo or Nunito as body text (#89). Body is DM Sans and headings are Fraunces (#104). Caprasimo stays on the wordmark (#92).
- Phone profile listed education as its own section after Get to know {name}, before Approach in therapy (#105, 2026-10-16). Education and credentials now sit in the facts card, under the license line and above insurance (2026-10-26).
- Identity tags on the published profile and the Find click-in. Hidden on public profiles 2026-10-26. Join and edit still collect them.
- Desktop name card listed Book a session before Free consult. Free consult is on the left and Book a session is on the right (2026-10-26).
- What's going on was seven topics, and Self Discovery showed only when it was already in the address. Other matched a specialty outside those seven, including Self Discovery. Replaced 2026-10-30 by twelve topics. Self Discovery is a named topic. Immigration stays address-only. Food or body image and Who I am are no longer unmapped topics; food and body maps to Eating Disorders & Body Image.
- The public profile photo sat below How {name} works and above Get to know {name}. The phone hero used a see-through play control, "Licensed by State of Texas / 38047", and no credential on the hero (#50–#56, later-frame photo 2026-10-29). Replaced 2026-10-30: the photo is the Find detail stage, and the license line is `Licensed in Texas (#38047)` in the facts card.
- Phone profile section order was How {name} works, then the photo, then Get to know {name}, then Approach in therapy, then Areas of interest, then In {name}'s own words (#105, facts-card education 2026-10-26). Replaced 2026-10-30 by the Find detail order on both widths: facts, How {name} works with Areas of interest then Approach in therapy, fees, then own words. No Get to know heading.
- Phone one-at-a-time rendered the public profile column (#121). The public page is now the Find detail at both widths. The swipe chrome on Find's phone one-at-a-time remains.
