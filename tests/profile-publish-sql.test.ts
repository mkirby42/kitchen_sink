import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20261012140000_therapist_published.sql",
  ),
  "utf8",
);

describe("therapist published migration", () => {
  it("backfills existing profiles as published and keeps one search", () => {
    expect(migration).toContain(
      "add column published boolean not null default true",
    );
    expect(migration).not.toMatch(/set\s+published\s*=\s*false/i);
    expect(migration).toContain(
      "drop function if exists public.search_therapists(text[], boolean, boolean, text, integer, integer)",
    );
    expect(migration).toContain("and (t.published or v_admin)");
    expect(migration).toContain("and (t.listed or v_admin)");
    expect(migration).toContain("t.published");
    expect(migration).toContain(
      "order by t.published asc, t.listed asc, hits.match_count desc, p.name",
    );
    expect(migration.match(/create function public.search_therapists/g)).toHaveLength(
      1,
    );
    expect(migration).toContain("therapists_open_listed_published_idx");
    expect(migration).toContain("and t.published");
  });

  it("refuses to unpublish from the API and shares one save for owner and admin", () => {
    expect(migration).toContain("A published profile stays published");
    expect(migration).toContain(
      "published = published or coalesce(p_publish, true)",
    );
    expect(migration).toContain(
      "v_keep_published or coalesce(p_publish, true)",
    );
    expect(migration).toContain("private.save_therapist_profile");
    expect(migration).toContain("admin_save_therapist_profile");
    expect(migration).toContain("p_publish boolean default true");
    expect(migration).toContain("Photo must stay in this profile folder");
    expect(migration).toContain(
      "An admin edit must not file a note as that therapist",
    );
    expect(migration).not.toMatch(/delete\s+from\s+auth\.users/i);
    expect(migration).not.toMatch(/delete\s+from\s+public\.profiles/i);
  });
});
