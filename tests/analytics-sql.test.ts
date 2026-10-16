import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261015140030_site_analytics.sql"),
  "utf8",
);

describe("site analytics migration", () => {
  it("stores anonymous events and refuses PII columns", () => {
    expect(migration).toContain("create table public.analytics_events");
    expect(migration).toContain("visitor_id uuid not null");
    expect(migration).toContain("session_id uuid not null");
    expect(migration).toContain(
      "event in ('page_view', 'card_click', 'profile_view', 'cta_click')",
    );
    expect(migration).toContain("cta in ('book', 'consult')");
    expect(migration).toContain("path !~ '\\.\\.'");
    expect(migration).toContain("enable row level security");
    expect(migration).not.toMatch(/\binet\b/i);
    expect(migration).not.toContain("ip_address");
    expect(migration).not.toContain("user_agent");
    expect(migration).not.toMatch(/\bemail\s+text\b/i);
    expect(migration).not.toContain("auth.uid()");
  });

  it("lets anon insert a narrow row and lets only an admin read", () => {
    expect(migration).toContain(
      "revoke all on table public.analytics_events from anon, authenticated",
    );
    expect(migration).toContain("grant insert (");
    expect(migration).toContain("visitor_id");
    expect(migration).toContain(") on table public.analytics_events to anon, authenticated");
    expect(migration).not.toContain("grant select on table public.analytics_events to anon");
    expect(migration).toContain(
      "grant select on table public.analytics_events to authenticated",
    );
    expect(migration).toContain("analytics_events_insert_anon");
    expect(migration).toContain("to anon");
    expect(migration).toContain("not (select private.is_admin())");
    expect(migration).toContain("analytics_events_select_admin");
    expect(migration).toContain("using ((select private.is_admin()))");
    expect(migration).not.toContain("for update");
    expect(migration).not.toContain("for delete");
    const grant = migration.slice(
      migration.indexOf("grant insert ("),
      migration.indexOf(") on table public.analytics_events"),
    );
    expect(grant).not.toContain("created_at");
    expect(grant).toContain("visitor_id");
    expect(grant).toContain("cta");
  });

  it("aggregates in a security invoker rpc that anon cannot call", () => {
    expect(migration).toContain(
      "function public.analytics_dashboard(p_days integer)",
    );
    expect(migration).toContain("security invoker");
    expect(migration).toContain("admin access required");
    expect(migration).toContain("page_views");
    expect(migration).toContain("unique_visitors");
    expect(migration).toContain("card_clicks");
    expect(migration).toContain("profile_views");
    expect(migration).toContain("book_clicks");
    expect(migration).toContain("consult_clicks");
    expect(migration).toContain(
      "revoke all on function public.analytics_dashboard(integer) from public, anon, authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.analytics_dashboard(integer) to authenticated",
    );
    const fn = migration.slice(migration.indexOf("function public.analytics_dashboard"));
    const returned = fn.slice(fn.indexOf("jsonb_build_object"));
    expect(returned).not.toContain("'visitor_id'");
    expect(returned).not.toContain("'session_id'");
    expect(fn).not.toContain("security definer");
  });
});
