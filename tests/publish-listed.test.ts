import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function sql(name: string) {
  return readFileSync(
    resolve(process.cwd(), "supabase/migrations", name),
    "utf8",
  );
}

const guard = sql("20260930190000_publish_listed_guard.sql");
const join = sql("20260930190100_complete_therapist_join_listed.sql");
const migration = `${guard}\n${join}`;

describe("publish sets directory listing", () => {
  it("writes listed true on join and treats a missing open flag as open", () => {
    const insertAt = migration.indexOf("insert into public.therapists");
    const insert = migration.slice(insertAt, migration.indexOf("insert into public.licenses"));
    expect(insert).toContain("listed");
    expect(insert).toContain("coalesce(p_open_to_new_clients, true)");
    expect(insert).toMatch(/coalesce\(p_open_to_new_clients, true\),\s*\n\s*true,/);
  });

  it("forces a normal therapist insert onto Find and still restores an admin hold", () => {
    expect(migration).toContain("new.listed := true");
    expect(migration).toContain("new.listed := v_listed");
    expect(migration).toContain("not private.is_admin()");
    expect(migration).toContain("Only an admin can change directory listing");
    expect(migration).toContain("therapist_listing_hold");
  });

  it("does not relist the sample hides", () => {
    expect(migration).not.toMatch(/update\s+public\.therapists/i);
    expect(migration).not.toContain("chrislo5240@gmail.com");
    expect(migration).not.toContain("mkirbyfin@gmail.com");
    expect(migration).not.toContain("christine lo");
    expect(migration).not.toContain("matt kirby");
  });
});
