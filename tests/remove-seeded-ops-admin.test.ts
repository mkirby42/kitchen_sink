import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const helperName = "20260925003100_admin_helper_upload.sql";
const removalName = "20260925170000_remove_seeded_ops_admin.sql";

describe("seeded ops admin removal", () => {
  const helper = readFileSync(resolve(migrationsDir, helperName), "utf8");
  const removal = readFileSync(resolve(migrationsDir, removalName), "utf8");
  const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");
  const requirements = readFileSync(
    resolve(process.cwd(), "docs/REQUIREMENTS.md"),
    "utf8",
  );

  it("sorts the wipe after the helper migration", () => {
    expect(helperName < removalName).toBe(true);
  });

  it("does not seed an ops login from the helper migration", () => {
    expect(helper).not.toContain("ops@example.com");
    expect(helper).not.toContain("seed-only");
    expect(helper).not.toContain("encrypted_password");
    expect(helper).not.toMatch(/insert\s+into\s+auth\.users/i);
  });

  it("deletes only when seed id and seed email both match", () => {
    expect(removal).toContain("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1");
    expect(removal).toContain("ops@example.com");
    expect(removal).toContain("lower(u.email) = ops_email");
    expect(removal).toContain("u.id = ops_id");
    expect(removal).toContain("delete from auth.users u");
    expect(removal).not.toMatch(/delete\s+from\s+public\.profiles/i);
    expect(removal).not.toMatch(/delete\s+from\s+auth\.users\s+where\s+email/i);
    expect(removal).toContain(
      "seeded ops removal left auth user % (%) in place; id and email did not both match",
    );
    expect(removal).toContain("set role = 'patient'");
  });

  it("rejects a later replay and does not ship a password", () => {
    expect(removal).toContain("profiles_reject_seeded_ops_admin");
    expect(removal).toContain("tg_op = 'INSERT'");
    expect(removal).not.toContain("seed-only");
    expect(removal).not.toContain("crypt(");
    expect(removal).not.toMatch(/encrypted_password/i);
    expect(removal).not.toMatch(/delete\s+from\s+storage\./i);
  });

  it("does not publish an ops password in the docs", () => {
    for (const doc of [readme, requirements]) {
      expect(doc).not.toContain("seed-only");
      expect(doc).not.toMatch(/ops@example\.com\s*\/\s*\S+/);
    }
    expect(readme).toContain("Never commit a password");
    expect(requirements).toContain("Never commit a password");
    expect(requirements).toContain("20260925170000_remove_seeded_ops_admin.sql");
  });
});
