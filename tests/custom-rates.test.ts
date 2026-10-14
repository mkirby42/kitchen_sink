import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import {
  commitRateServiceType,
  nextRate,
  RATE_SERVICE_LABEL_MAX,
} from "@/lib/join/rates";
import type { JoinDraft } from "@/lib/join/types";
import { draftFromRows } from "@/lib/join/load-draft";
import { buildJoinPayload, step4Errors } from "@/lib/join/validate";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20261012201000_custom_rate_labels.sql",
  ),
  "utf8",
);

const THERAPIST = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function draft(rates: JoinDraft["rates"]): JoinDraft {
  return {
    name: "Maya Chen",
    credential: "LMFT",
    yearsPracticing: 9,
    education: [],
    credentials: [],
    licenses: [{ number: "MFC 112938", state: "CA" }],
    photoKey: "uid/photo.jpg",
    videoKey: "uid/intro.mp4",
    voiceKey: null,
    voicePrompt: null,
    openToNewClients: true,
    virtual: true,
    inPerson: false,
    specialties: ["Anxiety"],
    modalities: ["CBT"],
    insurance: ["Aetna"],
    identity: [],
    location: null,
    rates,
    slidingScale: false,
    slidingScaleMinCents: null,
    slidingScaleMaxCents: null,
    cards: [
      { prompt: "one", answer: "a", tag: "about" },
      { prompt: "two", answer: "b", tag: "about" },
      { prompt: "three", answer: "c", tag: "about" },
    ],
    about: "",
    email: "maya@example.com",
    phone: "",
    outreach: ["email"],
    feedback: "",
  };
}

describe("custom rate labels", () => {
  it("adds the next preset, then a blank custom row once those are used", () => {
    expect(nextRate([{ service_type: "Individual" }]).service_type).toBe(
      "Couples",
    );
    expect(
      nextRate([
        { service_type: "individual" },
        { service_type: "Couples" },
        { service_type: "Family" },
        { service_type: "Group" },
      ]).service_type,
    ).toBe("");
    expect(
      nextRate([
        { service_type: "Individual" },
        { service_type: "Ketamine-assisted" },
      ]).service_type,
    ).toBe("Couples");
  });

  it("canonicalizes a free preset and leaves a taken one as typed", () => {
    expect(commitRateServiceType("  couples ", [])).toBe("Couples");
    expect(commitRateServiceType("  couples ", ["Couples"])).toBe("couples");
    expect(commitRateServiceType("  EMDR   intensive ", [])).toBe(
      "EMDR intensive",
    );
  });

  it("accepts several custom labels and rejects empty, long, and duplicate names", () => {
    const ok = draft([
      { service_type: "Individual", duration_minutes: 50, price_cents: 16500 },
      { service_type: "  Ketamine-assisted ", duration_minutes: 90, price_cents: 25000 },
      { service_type: "Supervision", duration_minutes: 60, price_cents: 12000 },
    ]);
    expect(step4Errors(ok)).toEqual([]);
    expect(buildJoinPayload(ok).rates).toEqual([
      { service_type: "Individual", duration_minutes: 50, price_cents: 16500 },
      { service_type: "Ketamine-assisted", duration_minutes: 90, price_cents: 25000 },
      { service_type: "Supervision", duration_minutes: 60, price_cents: 12000 },
    ]);

    expect(
      step4Errors(
        draft([
          { service_type: "   ", duration_minutes: 50, price_cents: 100 },
        ]),
      ),
    ).toContain("Add a name for each rate");

    expect(
      step4Errors(
        draft([
          {
            service_type: "a".repeat(RATE_SERVICE_LABEL_MAX + 1),
            duration_minutes: 50,
            price_cents: 100,
          },
        ]),
      ),
    ).toContain(
      `Rate names must be ${RATE_SERVICE_LABEL_MAX} characters or fewer`,
    );

    expect(
      step4Errors(
        draft([
          { service_type: "Supervision", duration_minutes: 50, price_cents: 100 },
          { service_type: " supervision ", duration_minutes: 60, price_cents: 120 },
        ]),
      ),
    ).toContain("Rate service types must be unique");

    expect(
      step4Errors(
        draft([
          { service_type: "Individual", duration_minutes: 50, price_cents: 100 },
          { service_type: "individual", duration_minutes: 60, price_cents: 120 },
        ]),
      ),
    ).toContain("Rate service types must be unique");

    expect(
      step4Errors(
        draft([
          {
            service_type: "a".repeat(RATE_SERVICE_LABEL_MAX),
            duration_minutes: 50,
            price_cents: 100,
          },
        ]),
      ),
    ).toEqual([]);
  });

  it("reloads a saved custom label into the editor", () => {
    const loaded = draftFromRows({
      email: "maya@example.com",
      profile: {
        name: "Maya Chen",
        email: "maya@example.com",
        phone: null,
        about_me: null,
        photo_key: "uid/photo.jpg",
        video_key: null,
      },
      therapist: {
        credential: "LMFT",
        start_date_of_practice: "2017-01-01",
        open_to_new_clients: true,
        virtual_practice: true,
        in_person_practice: false,
      },
      licenses: [{ number: "MFC 112938", state: "CA" }],
      qualifications: [],
      rates: [
        { service_type: "Individual", duration_minutes: 50, price_cents: 16500 },
        { service_type: "Ketamine-assisted", duration_minutes: 90, price_cents: 25000 },
        { service_type: "Supervision", duration_minutes: 60, price_cents: 12000 },
      ],
      tags: [],
      items: [],
      location: null,
    });

    expect(loaded.rates.map((rate) => rate.service_type)).toEqual([
      "Individual",
      "Ketamine-assisted",
      "Supervision",
    ]);
  });
});

describe("custom rate label migration", () => {
  it("leaves the published column and the draft/publish RPCs alone", () => {
    expect(migration).not.toMatch(/alter table public\.therapists/i);
    expect(migration).not.toMatch(/search_therapists/);
    expect(migration).not.toMatch(/save_therapist_profile/);
    expect(migration).not.toMatch(/complete_therapist_join/);
    expect(migration).not.toMatch(/admin_save_therapist_profile/);
    expect(migration).not.toMatch(/update_therapist_profile/);
    expect(migration).toMatch(/service_type/i);
    expect(migration).not.toMatch(/drop policy/i);
  });

  it("stores a trimmed custom label and rejects blanks, overflow, and case-only duplicates", async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        create table public.rates (
          id uuid primary key,
          therapist_id uuid not null,
          service_type text not null check (
            service_type in ('Individual', 'Couples', 'Family', 'Group')
          ),
          duration_minutes integer not null,
          price_cents integer not null,
          unique (therapist_id, service_type)
        );
      `);
      await db.exec(migration);

      await db.exec(`
        insert into public.rates (id, therapist_id, service_type, duration_minutes, price_cents)
        values
          ('11111111-1111-4111-8111-111111111111', '${THERAPIST}', 'Individual', 50, 16500),
          ('22222222-2222-4222-8222-222222222222', '${THERAPIST}', '  Ketamine-assisted  ', 90, 25000),
          ('33333333-3333-4333-8333-333333333333', '${THERAPIST}', 'Supervision', 60, 12000);
      `);

      const stored = await db.query<{ service_type: string }>(
        `select service_type from public.rates order by price_cents`,
      );
      expect(stored.rows.map((row) => row.service_type)).toEqual([
        "Supervision",
        "Individual",
        "Ketamine-assisted",
      ]);

      const duplicate = await db.exec(`
        insert into public.rates (id, therapist_id, service_type, duration_minutes, price_cents)
        values ('44444444-4444-4444-8444-444444444444', '${THERAPIST}', 'supervision', 45, 10000);
      `).then(
        () => null,
        (error: { code?: string }) => error,
      );
      expect(duplicate?.code).toBe("23505");

      const blank = await db.exec(`
        insert into public.rates (id, therapist_id, service_type, duration_minutes, price_cents)
        values ('55555555-5555-4555-8555-555555555555', '${THERAPIST}', '   ', 50, 10000);
      `).then(
        () => null,
        (error: { code?: string }) => error,
      );
      expect(blank?.code).toBe("23514");

      const long = await db.exec(`
        insert into public.rates (id, therapist_id, service_type, duration_minutes, price_cents)
        values (
          '66666666-6666-4666-8666-666666666666',
          '${THERAPIST}',
          '${"n".repeat(81)}',
          50,
          10000
        );
      `).then(
        () => null,
        (error: { code?: string }) => error,
      );
      expect(long?.code).toBe("23514");

      const presetCase = await db.exec(`
        insert into public.rates (id, therapist_id, service_type, duration_minutes, price_cents)
        values ('77777777-7777-4777-8777-777777777777', '${THERAPIST}', 'individual', 45, 10000);
      `).then(
        () => null,
        (error: { code?: string }) => error,
      );
      expect(presetCase?.code).toBe("23505");
    } finally {
      await db.close();
    }
  });

  it("runs after the published column without changing draft or live rows", async () => {
    const db = new PGlite();
    const live = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const draft = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    try {
      await db.exec(`
        create table public.therapists (
          profile_id uuid primary key,
          published boolean not null default true
        );
        create table public.rates (
          id uuid primary key default gen_random_uuid(),
          therapist_id uuid not null references public.therapists (profile_id),
          service_type text not null check (
            service_type in ('Individual', 'Couples', 'Family', 'Group')
          ),
          duration_minutes integer not null check (
            duration_minutes >= 1 and duration_minutes <= 480
          ),
          price_cents integer not null check (price_cents >= 0),
          unique (therapist_id, service_type)
        );
        insert into public.therapists (profile_id, published) values
          ('${live}', true),
          ('${draft}', false);
        insert into public.rates (id, therapist_id, service_type, duration_minutes, price_cents)
        values (
          '11111111-1111-4111-8111-111111111111',
          '${live}',
          'Individual',
          50,
          16500
        );
      `);
      await db.exec(migration);

      await db.exec(`
        insert into public.rates (therapist_id, service_type, duration_minutes, price_cents)
        select
          '${draft}'::uuid,
          rate.service_type,
          rate.duration_minutes,
          rate.price_cents
        from jsonb_to_recordset('[{"service_type":"  couples ","duration_minutes":50,"price_cents":12000},{"service_type":"  Ketamine-assisted  ","duration_minutes":90,"price_cents":25000}]'::jsonb)
          as rate(service_type text, duration_minutes integer, price_cents integer);
      `);

      const therapists = await db.query<{ profile_id: string; published: boolean }>(
        `select profile_id::text, published from public.therapists order by published`,
      );
      expect(therapists.rows).toEqual([
        { profile_id: draft, published: false },
        { profile_id: live, published: true },
      ]);

      const rates = await db.query<{ service_type: string }>(
        `select service_type from public.rates where therapist_id = '${draft}' order by price_cents`,
      );
      expect(rates.rows.map((row) => row.service_type)).toEqual([
        "Couples",
        "Ketamine-assisted",
      ]);

      const checks = await db.query<{ def: string }>(`
        select pg_get_constraintdef(oid) as def
        from pg_constraint
        where conrelid = 'public.rates'::regclass
          and contype = 'c'
        order by def
      `);
      const defs = checks.rows.map((row) => row.def);
      expect(defs.some((def) => def.includes("duration_minutes"))).toBe(true);
      expect(defs.some((def) => def.includes("price_cents"))).toBe(true);
      expect(defs.some((def) => def.includes("service_type in"))).toBe(false);
    } finally {
      await db.close();
    }
  });
});
