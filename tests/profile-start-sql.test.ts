import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261012150000_profile_starts.sql"),
  "utf8",
);

describe("profile starts migration", () => {
  it("stores the request and keeps drafts unlisted until the therapist publishes", () => {
    expect(migration).toContain("create table public.profile_starts");
    expect(migration).toContain("listed,\n    published,\n    virtual_practice");
    expect(migration).toContain(
      "true, false, false, false, false, false, false",
    );
    expect(migration).toContain("publish_started_profile");
    expect(migration).toContain("published = true");
    expect(migration).toContain(
      "This draft stays unpublished until the therapist publishes it",
    );
    expect(migration).toContain("Add an intro video before publishing");
    expect(migration).toContain("profile_start.publish");
    expect(migration).toContain(
      "This draft stays hidden until the therapist publishes it",
    );
    expect(migration).not.toContain("http_get");
    expect(migration).not.toContain("service_role key");
  });

  it("lets an admin edit any therapist without changing listed", () => {
    expect(migration).toContain("admin_update_therapist_profile");
    expect(migration).toContain("rates_select_admin_any");
    expect(migration).toContain("Does not change listed");
    const updateFn = migration.slice(
      migration.indexOf("function public.admin_update_therapist_profile"),
      migration.indexOf("function public.publish_started_profile"),
    );
    expect(updateFn).not.toContain("listed = true");
  });

  it("rate-limits public submits and keeps admin lookups off anon", () => {
    expect(migration).toContain("interval '24 hours'");
    expect(migration).toContain("v_recent >= 3");
    expect(migration).toContain("v_hour >= 40");
    expect(migration).toContain(
      "grant execute on function public.submit_profile_start(text, text, text[])\n  to anon, authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.admin_attach_started_profile(uuid, uuid)\n  to authenticated",
    );
    expect(migration).toContain("from public, anon");
  });
});
