import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import {
  AGE_RANGES,
  AREA_OPTIONS,
  FOCUS_AREAS,
  FORMAT_OPTIONS,
  PAYMENT_OPTIONS,
  TIMING_OPTIONS,
} from "@/lib/referrals/options";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261019160000_referral_board.sql"),
  "utf8",
);

const POSTER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const ADMIN = "33333333-3333-4333-8333-333333333333";
const DRAFT = "44444444-4444-4444-8444-444444444444";

async function database() {
  const db = new PGlite();
  await db.exec(`
    create schema if not exists auth;
    create schema if not exists private;
    create role anon;
    create role authenticated;
    create role service_role;
    create or replace function auth.uid()
    returns uuid
    language sql
    stable
    as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create or replace function auth.role()
    returns text
    language sql
    stable
    as $$
      select nullif(current_setting('request.jwt.claim.role', true), '')
    $$;
    create table public.profiles (
      id uuid primary key,
      role text,
      name text,
      email text
    );
    create table public.therapists (
      profile_id uuid primary key,
      credential text,
      published boolean not null default true,
      listed boolean not null default true,
      open_to_new_clients boolean not null default true,
      virtual_practice boolean not null default false,
      in_person_practice boolean not null default false,
      sliding_scale boolean not null default false
    );
    create table public.tags (
      id uuid primary key default gen_random_uuid(),
      profile_id uuid,
      kind text,
      label text
    );
    create or replace function private.is_admin()
    returns boolean
    language sql
    stable
    security definer
    set search_path = ''
    as $$
      select exists (
        select 1
        from public.profiles
        where id = (select auth.uid())
          and role = 'admin'
      );
    $$;
  `);
  await db.exec(migration);
  await db.exec(`
    insert into public.profiles (id, role, name, email) values
      ('${POSTER}', 'therapist', 'Ada Lopez', 'ada@example.com'),
      ('${OTHER}', 'therapist', 'Jules Tran', 'jules@example.com'),
      ('${ADMIN}', 'admin', 'Christine Lo', 'chris@example.com'),
      ('${DRAFT}', 'therapist', 'Draft Person', 'draft@example.com');
    insert into public.therapists (
      profile_id, credential, published, listed, open_to_new_clients,
      virtual_practice, in_person_practice, sliding_scale
    ) values
      ('${POSTER}', 'LPC', true, true, true, true, false, false),
      ('${OTHER}', 'LCSW', true, true, true, true, true, true),
      ('${DRAFT}', 'LMFT', false, false, true, true, false, false);
    insert into public.tags (profile_id, kind, label) values
      ('${OTHER}', 'specialty', 'ADHD'),
      ('${OTHER}', 'specialty', 'Teens'),
      ('${OTHER}', 'insurance', 'BCBS'),
      ('${OTHER}', 'insurance', 'Cash Pay Only');
  `);
  return db;
}

function asUser(id: string) {
  return `
    select set_config('request.jwt.claim.sub', '${id}', false);
    select set_config('request.jwt.claim.role', 'authenticated', false);
  `;
}

async function failMessage(db: PGlite, sql: string) {
  try {
    await db.exec(sql);
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

async function textArray(db: PGlite, fn: string) {
  const result = await db.query<{ v: string[] }>(
    `select ${fn}() as v`,
  );
  return result.rows[0].v;
}

describe("referral migration contract", () => {
  it("opens a post for one week and leaves room for a client poster", () => {
    expect(migration).toContain("interval '7 days'");
    expect(migration).not.toContain("14 days");
    expect(migration).toContain("poster_type = 'client'");
    expect(migration).toContain("handle");
    expect(migration).toContain("for_whom");
    expect(migration).not.toMatch(/client_email|client_name|client_phone/i);
    expect(migration).toContain("A published therapist profile is required.");
    expect(migration).toContain("You can''t respond to your own referral.");
  });
});

describe("referral board in postgres", () => {
  it("keeps the chip lists in lockstep with the form", async () => {
    const db = await database();
    expect(await textArray(db, "private.referral_age_ranges")).toEqual([
      ...AGE_RANGES,
    ]);
    expect(await textArray(db, "private.referral_focus_areas")).toEqual([
      ...FOCUS_AREAS,
    ]);
    expect(await textArray(db, "private.referral_payments")).toEqual([
      ...PAYMENT_OPTIONS,
    ]);
    expect(await textArray(db, "private.referral_formats")).toEqual([
      ...FORMAT_OPTIONS,
    ]);
    expect(await textArray(db, "private.referral_timings")).toEqual([
      ...TIMING_OPTIONS,
    ]);
    expect(await textArray(db, "private.referral_areas")).toEqual([
      ...AREA_OPTIONS,
    ]);
  });

  it("requires a published profile, approval, and a week-long window", async () => {
    const db = await database();

    await db.exec(asUser(DRAFT));
    expect(await failMessage(db, createSql())).toContain(
      "A published therapist profile is required.",
    );

    await db.exec(asUser(POSTER));
    expect(await failMessage(db, createSql(false))).toContain(
      "Confirm the post has no identifying details.",
    );
    expect(
      await failMessage(
        db,
        createSql(true, "array['My client Jane at Acme']"),
      ),
    ).toContain("Choose focus areas from the list.");
    expect(
      await failMessage(
        db,
        `select public.create_referral_post(
          'Adult, 30s',
          array['ADHD'],
          array['BCBS'],
          array['telehealth'],
          'South Austin',
          array['mornings'],
          true
        )`,
      ),
    ).toContain("An area is only for in-person requests.");

    const created = await db.query<{ id: string }>(createSql());
    const postId = created.rows[0].id;
    expect(postId).toBeTruthy();

    await db.exec(asUser(OTHER));
    expect(await failMessage(db, "select * from public.referral_board()")).toBe(
      "",
    );
    const hidden = await db.query<{ id: string }>(
      "select id from public.referral_board()",
    );
    expect(hidden.rows).toEqual([]);

    expect(
      await failMessage(
        db,
        `select public.moderate_referral('${postId}', 'approve')`,
      ),
    ).toContain("Admin access is required.");

    await db.exec(asUser(ADMIN));
    await db.exec(`select public.moderate_referral('${postId}', 'approve')`);

    await db.exec(asUser(OTHER));
    const board = await db.query<{
      id: string;
      viewer_is_poster: boolean;
      viewer_interested: boolean;
      interest_count: number;
    }>("select id, viewer_is_poster, viewer_interested, interest_count from public.referral_board()");
    expect(board.rows).toEqual([
      {
        id: postId,
        viewer_is_poster: false,
        viewer_interested: false,
        interest_count: 0,
      },
    ]);

    await db.exec(asUser(POSTER));
    expect(
      await failMessage(
        db,
        `select public.set_referral_interest('${postId}', true)`,
      ),
    ).toContain("You can't respond to your own referral.");

    await db.exec(asUser(OTHER));
    await db.exec(`select public.set_referral_interest('${postId}', true)`);
    await db.exec(`select public.set_referral_interest('${postId}', true)`);
    const counted = await db.query<{ interest_count: number }>(
      "select interest_count from public.referral_board()",
    );
    expect(counted.rows[0].interest_count).toBe(1);

    expect(
      await failMessage(
        db,
        `select * from public.referral_interest_roster('${postId}')`,
      ),
    ).toContain("That referral is not available.");

    await db.exec(asUser(POSTER));
    const roster = await db.query<{
      therapist_id: string;
      credential: string;
      specialty_labels: string[];
    }>(
      `select therapist_id, credential, specialty_labels from public.referral_interest_roster('${postId}')`,
    );
    expect(roster.rows[0].therapist_id).toBe(OTHER);
    expect(roster.rows[0].credential).toBe("LCSW");
    expect(roster.rows[0].specialty_labels).toContain("ADHD");

    const share = await db.query<{ id: string }>(
      `select public.create_referral_share('${postId}', array['${OTHER}']::uuid[]) as id`,
    );
    const shareId = share.rows[0].id;
    const ids = await db.query<{ referral_share: string[] }>(
      `select public.referral_share('${shareId}')`,
    );
    expect(ids.rows[0].referral_share).toEqual([OTHER]);

    const missing = await db.query<{ referral_share: string[] | null }>(
      "select public.referral_share('55555555-5555-4555-8555-555555555555')",
    );
    expect(missing.rows[0].referral_share).toBeNull();

    expect(
      await failMessage(
        db,
        `select public.create_referral_share('${postId}', array['${DRAFT}']::uuid[])`,
      ),
    ).toContain("Only interested therapists can be shared.");

    await db.exec(`select public.close_referral_post('${postId}')`);
    await db.exec(asUser(OTHER));
    const closedBoard = await db.query("select id from public.referral_board()");
    expect(closedBoard.rows).toEqual([]);

    await db.exec(asUser(POSTER));
    const token = await db.query<{ refresh_token: string }>(
      `select refresh_token from public.my_referrals()`,
    );
    const oldToken = token.rows[0].refresh_token;
    await db.exec(`select public.refresh_referral_post('${oldToken}')`);
    expect(
      await failMessage(
        db,
        `select public.refresh_referral_post('${oldToken}')`,
      ),
    ).toContain("That referral can't be refreshed.");

    await db.exec(asUser(OTHER));
    const reopened = await db.query("select id from public.referral_board()");
    expect(reopened.rows).toHaveLength(1);

    await db.exec(`
      update public.referral_posts
      set closes_at = now() - interval '1 hour'
      where id = '${postId}';
    `);
    const expired = await db.query("select id from public.referral_board()");
    expect(expired.rows).toEqual([]);

    await db.exec(`
      select set_config('request.jwt.claim.sub', '', false);
      select set_config('request.jwt.claim.role', 'service_role', false);
    `);
    const claimed = await db.query<{ poster_email: string; age_range: string }>(
      "select poster_email, age_range from public.claim_referral_refresh_prompts()",
    );
    expect(claimed.rows).toEqual([
      { poster_email: "ada@example.com", age_range: "Adult, 30s" },
    ]);
    const again = await db.query(
      "select post_id from public.claim_referral_refresh_prompts()",
    );
    expect(again.rows).toEqual([]);

    await db.exec(asUser(OTHER));
    expect(
      await failMessage(db, "select * from public.claim_referral_refresh_prompts()"),
    ).toContain("Admin access is required.");
  });

  it("lets a client-shaped row exist and blocks a bad therapist handle", async () => {
    const db = await database();
    await db.exec(`
      insert into public.referral_posts (
        poster_type, poster_id, handle, for_whom, status,
        age_range, focus_areas, payments, formats, timings, attested
      ) values (
        'client', '${POSTER}', 'quiet_heron_42', 'self', 'pending',
        'Adult, 30s', array['ADHD'], array['BCBS'], array['telehealth'],
        array['evenings'], true
      );
    `);
    const bad = await failMessage(
      db,
      `
        insert into public.referral_posts (
          poster_type, poster_id, handle, status,
          age_range, focus_areas, payments, formats, timings, attested
        ) values (
          'therapist', '${POSTER}', 'quiet_heron_42', 'pending',
          'Adult, 30s', array['ADHD'], array['BCBS'], array['telehealth'],
          array['evenings'], true
        );
      `,
    );
    expect(bad).toContain("referral_posts_poster_shape");
  });

  it("rejects a post and refuses to refresh it", async () => {
    const db = await database();
    await db.exec(asUser(POSTER));
    const created = await db.query<{ id: string }>(createSql());
    const postId = created.rows[0].id;
    await db.exec(asUser(ADMIN));
    await db.exec(`select public.moderate_referral('${postId}', 'reject')`);
    await db.exec(asUser(POSTER));
    const row = await db.query<{ refresh_token: string; status: string }>(
      "select refresh_token, status from public.my_referrals()",
    );
    expect(row.rows[0].status).toBe("rejected");
    expect(
      await failMessage(
        db,
        `select public.refresh_referral_post('${row.rows[0].refresh_token}')`,
      ),
    ).toContain("That referral can't be refreshed.");
  });
});

function createSql(attested = true, focus = "array['ADHD','Anxiety']") {
  return `
    select public.create_referral_post(
      'Adult, 30s',
      ${focus},
      array['BCBS','Private pay'],
      array['telehealth'],
      null,
      array['mornings'],
      ${attested ? "true" : "false"}
    ) as id
  `;
}
