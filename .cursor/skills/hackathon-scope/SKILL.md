---
name: hackathon-scope
description: Use when adding features, pages, tables, or "nice to have" work in Kitchen Sink. Enforces the hackathon must-ship list and blocks booking, patient UI, and extra surface area.
---

# Hackathon scope

Hours left, not weeks. Code surface is a scoring risk.

## Do

Read `docs/REQUIREMENTS.md` **Must ship** and **Cut**. Build only Must ship.

## Do not

- Booking, calendars, payments, in-app messaging
- Patient onboarding wizard, patient public profiles, patient location UI
- Review create/edit (seed + display only)
- Maps, distance search, likes/hearts chrome
- Video transcoding or more than one intro clip per therapist
- New tag kinds, new design system.
- Extra libraries when the stack already covers it

## If tempted

Ask: does a judge need this to complete Find → Profile (play intro) → Join (photo + video)? If no, stop.

Booking buttons on the profile screenshot become `mailto:` / `tel:` using outreach tags. That is enough.
