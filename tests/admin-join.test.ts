import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_JOIN_NOTICE, joinAccess } from "@/lib/join/access";
import { isPublicTherapistRole } from "@/lib/role";

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
    expect(ADMIN_JOIN_NOTICE).toContain("stays admin");
    expect(ADMIN_JOIN_NOTICE).toContain("replaces");
  });
});
