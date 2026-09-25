import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260925154000_admin_client_reviews.sql",
  ),
  "utf8",
);

describe("admin client reviews", () => {
  it("sorts between directory listing and review moderation", () => {
    expect(
      "20260925153000_therapist_directory_listing.sql" <
        "20260925154000_admin_client_reviews.sql",
    ).toBe(true);
    expect(
      "20260925154000_admin_client_reviews.sql" <
        "20260925160000_review_moderation.sql",
    ).toBe(true);
  });

  it("returns the existing admin profile instead of inserting a second row", () => {
    expect(migration).toContain("if v_role = 'therapist' then");
    expect(migration).toContain("if v_role in ('patient', 'admin') then");
    expect(migration).toContain("return v_id;");
    expect(migration).not.toMatch(/set role = 'patient'/);
    expect(migration).not.toContain("update public.profiles");
  });

  it("accepts a patient or admin and still blocks self-review and closed profiles", () => {
    expect(migration).toContain("p.role in ('patient', 'admin')");
    expect(migration).toContain("You cannot review your own profile.");
    expect(migration).toContain("This therapist is not open to new clients.");
    expect(migration).toContain("and t.open_to_new_clients");
    expect(migration).toContain("and t.listed");
    expect(migration).toContain("Sign in as a client to leave a review.");
  });
});
