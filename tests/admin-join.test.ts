import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_JOIN_NOTICE, joinAccess } from "@/lib/join/access";
import { isPublicTherapistRole } from "@/lib/role";
import { joinPath } from "@/lib/routes";

const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";

describe("joinAccess", () => {
  it("lets an admin start signup with no therapist row", () => {
    expect(
      joinAccess({
        userId: adminId,
        role: "admin",
        hasTherapist: false,
        editing: false,
      }),
    ).toEqual({ kind: "wizard", editing: false, adminTest: true });
  });

  it("lets an admin replace a leftover therapist row instead of leaving join", () => {
    expect(
      joinAccess({
        userId: adminId,
        role: "admin",
        hasTherapist: true,
        editing: false,
      }),
    ).toEqual({ kind: "wizard", editing: false, adminTest: true });
  });

  it("still edits an admin test profile in place", () => {
    expect(
      joinAccess({
        userId: adminId,
        role: "admin",
        hasTherapist: true,
        editing: true,
      }),
    ).toEqual({ kind: "wizard", editing: true, adminTest: true });
  });

  it("sends a therapist who already joined to their profile", () => {
    expect(
      joinAccess({
        userId: adminId,
        role: "therapist",
        hasTherapist: true,
        editing: false,
      }),
    ).toEqual({ kind: "redirect", href: `/t/${adminId}` });
  });

  it("loads a therapist's saved profile when they open edit", () => {
    expect(
      joinAccess({
        userId: adminId,
        role: "therapist",
        hasTherapist: true,
        editing: true,
      }),
    ).toEqual({ kind: "wizard", editing: true, adminTest: false });
  });

  it("keeps edit=1 when Continue advances, and drops it when editing is off", () => {
    expect(joinPath({ edit: true, step: 2 })).toBe("/join?edit=1&step=2");
    const dropped = joinPath({ edit: false, step: 2 });
    expect(dropped).toBe("/join?step=2");
    expect(
      joinAccess({
        userId: adminId,
        role: "therapist",
        hasTherapist: true,
        editing: false,
      }),
    ).toEqual({ kind: "redirect", href: `/t/${adminId}` });
  });

  it("lets an admin edit someone else's profile", () => {
    const therapistId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";
    expect(
      joinAccess({
        userId: adminId,
        role: "admin",
        hasTherapist: false,
        editing: true,
        targetProfileId: therapistId,
      }),
    ).toEqual({
      kind: "wizard",
      editing: true,
      adminTest: true,
      profileId: therapistId,
    });
  });

  it("refuses a non-admin edit of someone else's profile", () => {
    expect(
      joinAccess({
        userId: adminId,
        role: "therapist",
        hasTherapist: true,
        editing: true,
        targetProfileId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
      }),
    ).toEqual({ kind: "redirect", href: `/t/${adminId}` });
  });

  it("lets an admin fill a started draft", () => {
    expect(
      joinAccess({
        userId: adminId,
        role: "admin",
        hasTherapist: false,
        editing: false,
        forId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual({
      kind: "wizard",
      editing: true,
      adminTest: false,
      onBehalfId: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("keeps an admin's own edit on their test profile", () => {
    expect(
      joinAccess({
        userId: adminId,
        role: "admin",
        hasTherapist: true,
        editing: true,
        forId: adminId,
      }),
    ).toEqual({ kind: "wizard", editing: true, adminTest: true });
  });

  it("does not let a therapist open someone else's started draft", () => {
    expect(
      joinAccess({
        userId: adminId,
        role: "therapist",
        hasTherapist: true,
        editing: false,
        forId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual({ kind: "redirect", href: `/t/${adminId}` });
  });

  it("blocks a patient account", () => {
    expect(
      joinAccess({
        userId: adminId,
        role: "patient",
        hasTherapist: false,
        editing: false,
      }),
    ).toEqual({ kind: "patient" });
  });
});

describe("public therapist role", () => {
  it("shows therapist and admin profiles", () => {
    expect(isPublicTherapistRole("therapist")).toBe(true);
    expect(isPublicTherapistRole("admin")).toBe(true);
    expect(isPublicTherapistRole("patient")).toBe(false);
    expect(isPublicTherapistRole(null)).toBe(false);
  });
});

describe("admin join migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260925120000_admin_therapist_join.sql",
    ),
    "utf8",
  );

  it("keeps admin and replaces leftover therapist rows", () => {
    expect(sql).toContain("v_role is distinct from 'admin'");
    expect(sql).toContain("private.clear_own_admin_therapist_rows()");
    expect(sql).toContain("and role = 'admin'");
    expect(sql).toContain(
      "Therapist join has already been completed for this user",
    );
    expect(sql).not.toContain("delete from public.profiles");
    expect(sql).not.toContain("delete from auth.users");
    expect(sql).toContain("role in ('therapist', 'admin')");
  });

  it("matches the join notice", () => {
    expect(ADMIN_JOIN_NOTICE).toContain("signed in as an admin");
    expect(ADMIN_JOIN_NOTICE).toContain("replaces your existing test profile");
    expect(ADMIN_JOIN_NOTICE).toContain(
      "hidden from the public Find page (admins can still see it, marked admin-only)",
    );
    expect(ADMIN_JOIN_NOTICE).toContain(
      "sign out first and sign up with a different email",
    );
    expect(ADMIN_JOIN_NOTICE).not.toContain("publishes");
    expect(ADMIN_JOIN_NOTICE).not.toMatch(/PR\s*#?\d+/);
  });
});
