import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20261007214457_admin_sees_unlisted_directory.sql",
  ),
  "utf8",
);

const fn = migration.slice(
  migration.indexOf("create function public.search_therapists"),
  migration.indexOf("comment on function public.search_therapists"),
);

describe("admin unlisted directory", () => {
  it("keeps search security invoker and gates unlisted rows on private.is_admin()", () => {
    expect(migration).toContain(
      "drop function if exists public.search_therapists(text[], boolean, boolean, text, integer, integer)",
    );
    expect(fn).toContain("security invoker");
    expect(fn).not.toContain("security definer");
    expect(fn).toContain("if (select auth.uid()) is not null then");
    expect(fn).toContain("v_admin := (select private.is_admin())");
    expect(fn).toContain("and (t.listed or v_admin)");
    expect(fn).toContain("t.open_to_new_clients");
    expect(fn).toContain("t.listed");
    expect(fn).not.toMatch(/p_include|p_admin|p_listed/i);
    expect(fn).not.toMatch(/\bemail\b|\bphone\b|about_me/);
  });

  it("does not grant unlisted practice reads to anon or open feedback", () => {
    const policies = migration.slice(migration.indexOf("drop policy if exists rates_select_admin_unlisted"));
    expect(policies).toContain("to authenticated");
    expect(policies).not.toMatch(/to anon/);
    expect(policies).toContain("(select private.is_admin())");
    expect(policies).toContain("and t.open_to_new_clients");
    expect(policies).toContain("and not t.listed");
    for (const table of [
      "rates",
      "licenses",
      "locations",
      "tags",
      "profile_items",
      "qualifications",
    ]) {
      expect(policies).toContain(`on public.${table}`);
    }
    expect(policies).not.toMatch(/feedback/i);
    expect(policies).not.toMatch(/drop policy if exists \w+_select_public/);
  });
});
