# Interest (anonymous)

Patient taps **I'm interested** on a therapist profile. Therapist opens `/matches` and sees who did — as aliases, not identities.

This is **current** behavior. Changing anonymity, messaging, or contact reveal is allowed; update this file and REQUIREMENTS in the same change.

## Current rules

- Signal only. No messaging, accept, or contact reveal. Patients still use the existing `mailto:` / `tel:` buttons to actually reach out.
- Anonymous means the therapist UI never shows name, email, phone, or photo. Alias is `Patient ·` + last 4 hex chars of the patient UUID (no dashes, uppercased). Example: `22222222-2222-4222-8222-222222222222` → `Patient · 2222`.
- No patient onboarding wizard. First interest (or first sign-in on the profile control) calls `ensure_patient_profile()` and inserts `profiles.role = 'patient'`, `name = 'Patient'`.
- Email + password, same Auth as `/join`. Therapists cannot express interest. Patients cannot open `/matches`. You cannot interest yourself. Therapist must be `open_to_new_clients` to receive a new row.
- Toggle off deletes the row. No realtime; refresh after write.
- Seed: J.R., Priya, and D.M. already interested in Maya. Demo: `jr@kitchensink.demo` / `seed-only` and `maya@kitchensink.demo` / `seed-only`.

## Later (not blocked)

Booking, in-app messages, likes/hearts chrome, patient profiles, maps, extra tag kinds.
