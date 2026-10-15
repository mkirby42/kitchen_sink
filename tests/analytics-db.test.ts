import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261015140030_site_analytics.sql"),
  "utf8",
);

const VISITOR = "11111111-1111-4111-8111-111111111111";
const SESSION = "22222222-2222-4222-8222-222222222222";
const THERAPIST = "33333333-3333-4333-8333-333333333333";

async function database() {
  const db = new PGlite();
  await db.exec(`
    create schema if not exists private;
    create role anon;
    create role authenticated;
    create table public.profiles (
      id uuid primary key,
      role text,
      name text
    );
    insert into public.profiles (id, role, name)
    values ('${THERAPIST}', 'therapist', 'Maya Chen');
    create or replace function private.is_admin()
    returns boolean
    language sql
    stable
    as $$ select false $$;
  `);
  await db.exec(migration);
  return db;
}

describe("analytics events in postgres", () => {
  it("accepts a narrow anonymous row and rejects PII-shaped payloads", async () => {
    const db = await database();
    await db.exec(`
      insert into public.analytics_events (visitor_id, session_id, event, path)
      values ('${VISITOR}', '${SESSION}', 'page_view', '/find');
    `);

    const badPath = await db.exec(`
      insert into public.analytics_events (visitor_id, session_id, event, path)
      values ('${VISITOR}', '${SESSION}', 'page_view', '/reset-password?code=secret');
    `).then(
      () => "inserted",
      () => "rejected",
    );
    expect(badPath).toBe("rejected");

    const dotted = await db.exec(`
      insert into public.analytics_events (visitor_id, session_id, event, path)
      values ('${VISITOR}', '${SESSION}', 'page_view', '/find/../admin');
    `).then(
      () => "inserted",
      () => "rejected",
    );
    expect(dotted).toBe("rejected");

    const withTherapist = await db.exec(`
      insert into public.analytics_events (visitor_id, session_id, event, path, therapist_id)
      values ('${VISITOR}', '${SESSION}', 'page_view', '/find', '${THERAPIST}');
    `).then(
      () => "inserted",
      () => "rejected",
    );
    expect(withTherapist).toBe("rejected");

    await db.exec(`
      insert into public.analytics_events (visitor_id, session_id, event, path, therapist_id, cta)
      values ('${VISITOR}', '${SESSION}', 'cta_click', '/t/${THERAPIST}', '${THERAPIST}', 'book');
      insert into public.analytics_events (visitor_id, session_id, event, path, therapist_id)
      values ('${VISITOR}', '${SESSION}', 'card_click', '/find', '${THERAPIST}');
      insert into public.analytics_events (visitor_id, session_id, event, path, therapist_id)
      values ('${VISITOR}', '${SESSION}', 'profile_view', '/t/${THERAPIST}', '${THERAPIST}');
    `);
  });

  it("lets anon insert, hides the rows, and returns totals only to an admin", async () => {
    const db = await database();
    await db.exec(`
      grant usage on schema public to anon, authenticated;
      grant usage on schema private to authenticated;
      grant execute on function private.is_admin() to authenticated;
    `);

    await db.exec("set role anon");
    await db.exec(`
      insert into public.analytics_events (visitor_id, session_id, event, path)
      values ('${VISITOR}', '${SESSION}', 'page_view', '/');
    `);
    const anonRead = await db.exec(
      "select * from public.analytics_events",
    ).then(
      (result) => result.rows.length,
      () => "denied",
    );
    expect(anonRead).toBe("denied");

    await db.exec("reset role");
    await db.exec(`
      insert into public.analytics_events (visitor_id, session_id, event, path, therapist_id)
      values ('${VISITOR}', '${SESSION}', 'card_click', '/find', '${THERAPIST}');
    `);

    await db.exec("set role authenticated");
    const denied = await db.exec("select public.analytics_dashboard(7)").then(
      () => "ok",
      (error: { message?: string }) => error.message ?? "failed",
    );
    expect(denied).toMatch(/admin access required/i);
    await db.exec("reset role");

    await db.exec(`
      create or replace function private.is_admin()
      returns boolean
      language sql
      stable
      security definer
      set search_path = ''
      as $$ select true $$;
      grant execute on function private.is_admin() to authenticated;
      grant select on table public.profiles to authenticated;
    `);
    await db.exec("set role authenticated");
    const result = await db.query<{ data: {
      page_views: number;
      visits: number;
      unique_visitors: number;
      therapists: { name: string; card_clicks: number }[];
      trend: { day: string }[];
    } }>("select public.analytics_dashboard(30) as data");
    await db.exec("reset role");
    const data = result.rows[0]?.data as {
      page_views: number;
      visits: number;
      unique_visitors: number;
      therapists: { name: string; card_clicks: number }[];
      trend: { day: string }[];
    };
    expect(data.page_views).toBe(1);
    expect(data.visits).toBe(1);
    expect(data.unique_visitors).toBe(1);
    expect(data.therapists).toEqual([
      expect.objectContaining({ name: "Maya Chen", card_clicks: 1 }),
    ]);
    expect(data.trend.length).toBe(30);
    expect(JSON.stringify(data)).not.toContain(VISITOR);
  });
});
