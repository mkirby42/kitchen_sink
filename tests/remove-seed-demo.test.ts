import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const guardName = "20260925003000_remove_seed_demo_profiles.sql";
const finishName = "20260925043000_finish_demo_profile_removal.sql";

function sqlEmails(sql: string) {
  return [...sql.matchAll(/'([a-z0-9._+-]+@kitchensink\.demo)'/g)].map(
    (match) => match[1],
  );
}

describe("demo seed removal", () => {
  const guard = readFileSync(resolve(migrationsDir, guardName), "utf8");
  const finish = readFileSync(resolve(migrationsDir, finishName), "utf8");
  const seedSql = readdirSync(migrationsDir)
    .filter(
      (name) =>
        name.includes("seed_") &&
        name.endsWith(".sql") &&
        name !== guardName &&
        name !== finishName,
    )
    .map((name) => readFileSync(resolve(migrationsDir, name), "utf8"))
    .join("\n");

  it("sorts the wipe after the seed migrations and the guard", () => {
    const names = readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql"))
      .sort();
    const seedNames = names.filter(
      (name) => name.includes("seed_") && name !== guardName && name !== finishName,
    );
    expect(seedNames.length).toBeGreaterThan(0);
    for (const name of seedNames) {
      expect(name < finishName).toBe(true);
    }
    expect(guardName < finishName).toBe(true);
  });

  it("lists every seed email from the seed migrations", () => {
    const seeded = new Set(sqlEmails(seedSql));
    const removed = new Set(sqlEmails(finish));
    expect(seeded.size).toBe(14);
    for (const email of seeded) {
      expect(removed.has(email)).toBe(true);
    }
  });

  it("deletes only when seed id and seed email both match", () => {
    expect(finish).toContain("lower(u.email) = s.email");
    expect(finish).toContain("s.id = u.id");
    expect(finish).not.toMatch(/delete\s+from\s+public\.profiles/i);
    expect(finish).toContain(
      "left auth user % (%) in place; id and email did not both match the seed list",
    );
  });

  it("rejects a later replay of seed inserts", () => {
    for (const sql of [guard, finish]) {
      expect(sql).toContain("tg_op = 'INSERT'");
      expect(sql).toContain("new_domain = 'kitchensink.demo'");
      expect(sql).toContain("new.id = any (seed_ids)");
      expect(sql).toContain("profiles_reject_demo_seed_email");
    }
    expect(finish).not.toMatch(/delete\s+from\s+auth\.users\s+where\s+email/i);
  });

  it("does not delete storage rows in SQL", () => {
    for (const sql of [guard, finish]) {
      expect(sql).not.toMatch(/delete\s+from\s+storage\./i);
      expect(sql).not.toContain("storage.allow_delete_query");
    }
    expect(finish).toContain("set owner = null, owner_id = null");
    expect(finish).toContain("delete from auth.users u");
  });
});
