import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260925160000_review_moderation.sql",
  ),
  "utf8",
);

describe("review moderation migration", () => {
  it("starts new reviews pending and leaves already-public rows approved", () => {
    expect(sql).toContain("alter column status set default 'pending'");
    expect(sql).toContain("set status = 'approved'");
    expect(sql).toContain("where status is null");
    expect(sql).toContain("status in ('pending', 'approved')");
    expect(sql).not.toMatch(/status in \([^)]*rejected/);
  });

  it("publishes only approved reviews and hard-deletes rejects", () => {
    expect(sql).toContain("status = 'approved'");
    expect(sql).toContain("and t.listed");
    expect(sql).toContain("new.status := 'pending'");
    expect(sql).toContain("p.role in ('patient', 'admin')");
    expect(sql).toContain("new.patient_id is distinct from (select auth.uid())");
    expect(sql).not.toContain("ensure_patient_profile");
    expect(sql).toContain("for delete");
    expect(sql).toContain("private.is_admin()");
    expect(sql).toContain("as restrictive");
    expect(sql).toContain("with check (status = 'pending')");
    expect(sql).not.toContain("deleted_reviews");
    expect(sql).not.toContain("review_archive");
    expect(sql).not.toMatch(/patient_hidden\s*=\s*true/);
    expect(sql).not.toContain("drop policy if exists reviews_delete_own");
  });
});