import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const phi = readFileSync(resolve(process.cwd(), "lib/reviews/phi.ts"), "utf8");

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260928131234_client_review_accounts_only.sql",
  ),
  "utf8",
);

const moderation = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260925160000_review_moderation.sql",
  ),
  "utf8",
);

describe("client review accounts only", () => {
  it("sorts after review moderation", () => {
    expect(
      "20260925160000_review_moderation.sql" <
        "20260928131234_client_review_accounts_only.sql",
    ).toBe(true);
  });

  it("clears practice data on patient rows and does not delete accounts or reviews", () => {
    expect(migration).toContain("where role = 'patient'");
    expect(migration).toContain("phone = null");
    expect(migration).toContain("about_me = null");
    expect(migration).toContain("photo_key = null");
    expect(migration).toContain("video_key = null");
    expect(migration).toContain("delete from public.tags");
    expect(migration).toContain("delete from public.locations");
    expect(migration).toContain("delete from public.feedback");
    expect(migration).toContain("delete from public.therapists");
    expect(migration).not.toMatch(/delete\s+from\s+public\.profiles/i);
    expect(migration).not.toMatch(/delete\s+from\s+public\.reviews/i);
    expect(migration).not.toMatch(/delete\s+from\s+auth\.users/i);
    expect(migration).not.toMatch(/delete\s+from\s+storage\./i);
  });

  it("lets a patient insert only a review account", () => {
    expect(migration).toContain("btrim(name) = 'Patient'");
    expect(migration).toContain("auth.jwt() ->> 'email'");
    expect(migration).toContain("nullif(btrim(phone), '') is null");
    expect(migration).toContain("nullif(btrim(about_me), '') is null");
    expect(migration).toContain("private.is_practice_owner");
    expect(migration).toContain("p.role in ('therapist', 'admin')");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    const publicGuard = migration.slice(
      migration.indexOf("create or replace function public.reviews_guard"),
    );
    expect(publicGuard).toContain("security invoker");
    expect(publicGuard).not.toContain("security definer");
  });

  it("blocks patient photo and video uploads", () => {
    expect(migration).toContain("photos_videos_insert_own");
    expect(migration).toContain("p.role = 'patient'");
    expect(migration).toContain("bucket_id in ('photos', 'videos')");
  });

  it("keeps review approval and drops leftover session notes on a signed-in save", () => {
    expect(migration).toContain("new.status := 'pending'");
    expect(migration).toContain("new.session_format := null");
    expect(migration).toContain("new.duration_label := null");
    expect(migration).toContain("new.session_format := old.session_format");
    expect(migration).toContain("p.role in ('patient', 'admin')");
    expect(migration).toContain("personal health");
    expect(phi).toContain("Do not include personal health information");
    expect(moderation).toContain("with check (status = 'pending')");
    expect(migration).not.toContain("deleted_reviews");
    expect(migration).not.toContain("review_archive");
  });
});
