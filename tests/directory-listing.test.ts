import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isDirectoryListed } from "@/lib/therapists/listing";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260925153000_therapist_directory_listing.sql",
  ),
  "utf8",
);

describe("directory listing", () => {
  it("treats only an explicit false as hidden", () => {
    expect(isDirectoryListed(true)).toBe(true);
    expect(isDirectoryListed(undefined)).toBe(true);
    expect(isDirectoryListed(null)).toBe(true);
    expect(isDirectoryListed(false)).toBe(false);
  });

  it("hides two named profiles without deleting accounts", () => {
    expect(migration).toContain("add column listed boolean not null default true");
    expect(migration).toContain("and t.listed");
    expect(migration).toContain("chrislo5240@gmail.com");
    expect(migration).toContain("mkirbyfin@gmail.com");
    expect(migration).toContain("christine lo");
    expect(migration).toContain("matt kirby");
    expect(migration).toContain("set listed = false");
    expect(migration).toContain("admin_set_therapist_listed");
    expect(migration).toContain("Only an admin can change directory listing");
    expect(migration).not.toMatch(/delete\s+from\s+auth\.users/i);
    expect(migration).not.toMatch(/delete\s+from\s+public\.profiles/i);
  });

  it("keeps the listing writer out of the exposed public schema", () => {
    const publicFn = migration.slice(
      migration.indexOf("create or replace function public.admin_set_therapist_listed"),
    );
    expect(publicFn).toContain("security invoker");
    expect(publicFn).not.toContain("security definer");
    expect(publicFn).toContain(
      "perform private.admin_set_therapist_listed(p_therapist_id, p_listed)",
    );
  });
});
