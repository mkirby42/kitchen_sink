import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260930183000_feedback_email_claim.sql",
  ),
  "utf8",
);

describe("feedback email claim", () => {
  it("adds the claim column and does not email rows that already existed", () => {
    expect(migration).toContain("add column notified_at timestamptz");
    expect(migration).toContain("column_name = 'notified_at'");
    expect(migration).toContain("set notified_at = now()");
    expect(migration).toContain("where notified_at is null");
  });

  it("claims only the signed-in user's fresh row", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("f.profile_id = v_uid");
    expect(migration).toContain("interval '24 hours'");
    expect(migration).toContain("btrim(f.body) = btrim(p_body)");
    expect(migration).toContain("for update");
    expect(migration).not.toContain("service_role key");
  });

  it("lets the signed-in user claim and release, and not anon", () => {
    expect(migration).toContain(
      "grant execute on function public.claim_own_feedback_for_email(text)\n  to authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.release_own_feedback_email_claim(uuid)\n  to authenticated",
    );
    expect(migration).toContain("from public, anon, authenticated, service_role");
    expect(migration).toContain("set notified_at = null");
  });
});
