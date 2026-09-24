import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260925050000_delete_own_therapist_profile.sql",
  ),
  "utf8",
);

const schema = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260919163313_initial_schema.sql"),
  "utf8",
);

const qualifications = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260924160000_qualifications_drop_supervisor.sql",
  ),
  "utf8",
);

describe("delete_own_therapist_profile authorization", () => {
  it("sorts after the demo-profile removal migration", () => {
    expect(
      "20260925043000_finish_demo_profile_removal.sql" <
        "20260925050000_delete_own_therapist_profile.sql",
    ).toBe(true);
  });

  it("deletes only the signed-in therapist after the typed phrase", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("(select auth.uid())");
    expect(migration).toContain("p_confirm is distinct from 'DELETE'");
    expect(migration).toContain("v_role is distinct from 'therapist'");
    expect(migration).toMatch(
      /delete from public\.profiles\s+where id = v_id\s+and role = 'therapist'/,
    );
    expect(migration).not.toMatch(/delete\s+from\s+auth\.users/i);
    expect(migration).not.toMatch(/delete\s+from\s+storage\./i);
    expect(migration).toContain("grant execute on function public.delete_own_therapist_profile(text)");
    expect(migration).toContain("to authenticated");
    expect(migration).toContain("revoke all on function public.delete_own_therapist_profile(text)");
    expect(migration).toContain("from public, anon, authenticated, service_role");
  });

  it("keeps the definer function out of the exposed public schema", () => {
    const publicFn = migration.slice(
      migration.indexOf("create or replace function public.delete_own_therapist_profile"),
    );
    expect(publicFn).toContain("security invoker");
    expect(publicFn).not.toContain("security definer");
    expect(publicFn).toContain("perform private.delete_own_therapist_profile(p_confirm)");
  });

  it("cascades therapist-owned rows, including reviews about them", () => {
    expect(schema).toMatch(
      /therapists[\s\S]*profile_id uuid primary key references public\.profiles \(id\) on delete cascade/,
    );
    expect(schema).toMatch(
      /reviews[\s\S]*therapist_id uuid not null references public\.therapists \(profile_id\) on delete cascade/,
    );
    expect(schema).toMatch(
      /patient_id uuid references public\.profiles \(id\) on delete set null/,
    );
    expect(schema).toMatch(
      /rates[\s\S]*references public\.therapists \(profile_id\) on delete cascade/,
    );
    expect(schema).toMatch(
      /tags[\s\S]*references public\.profiles \(id\) on delete cascade/,
    );
    expect(schema).toMatch(
      /profile_items[\s\S]*references public\.therapists \(profile_id\) on delete cascade/,
    );
    expect(qualifications).toMatch(
      /qualifications[\s\S]*references public\.therapists \(profile_id\) on delete cascade/,
    );
  });
});
