import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const removalName = "20260925003000_remove_seed_demo_profiles.sql";

function sqlEmails(sql: string) {
  return [...sql.matchAll(/'([a-z0-9._+-]+@kitchensink\.demo)'/g)].map(
    (match) => match[1],
  );
}

describe("demo seed removal", () => {
  const removal = readFileSync(resolve(migrationsDir, removalName), "utf8");
  const seedSql = readdirSync(migrationsDir)
    .filter(
      (name) =>
        name.includes("seed_") && name.endsWith(".sql") && name !== removalName,
    )
    .map((name) => readFileSync(resolve(migrationsDir, name), "utf8"))
    .join("\n");

  it("sorts after the seed migrations so a fresh migrate does not keep fakes", () => {
    const names = readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql"))
      .sort();
    const seedNames = names.filter(
      (name) => name.includes("seed_") && name !== removalName,
    );
    expect(seedNames.length).toBeGreaterThan(0);
    for (const name of seedNames) {
      expect(name < removalName).toBe(true);
    }
  });

  it("lists every seed email from the seed migrations", () => {
    const seeded = new Set(sqlEmails(seedSql));
    const removed = new Set(sqlEmails(removal));
    expect(seeded.size).toBe(14);
    for (const email of seeded) {
      expect(removed.has(email)).toBe(true);
    }
  });

  it("deletes only when seed id and seed email both match", () => {
    expect(removal).toContain("lower(u.email) = s.email");
    expect(removal).toContain("s.id = u.id");
    expect(removal).not.toMatch(/delete\s+from\s+public\.profiles/i);
    expect(removal).toContain(
      "left auth user % (%) in place; id and email did not both match the seed list",
    );
  });

  it("rejects a later replay of seed inserts", () => {
    expect(removal).toContain("tg_op = 'INSERT'");
    expect(removal).toContain("new_domain = 'kitchensink.demo'");
    expect(removal).toContain("new.id = any (seed_ids)");
    expect(removal).not.toMatch(/delete\s+from\s+auth\.users\s+where\s+email/i);
  });
});
