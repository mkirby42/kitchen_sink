import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20261012143000_admin_manage_therapist_profile.sql",
  ),
  "utf8",
);

describe("admin profile edit and delete", () => {
  it("sorts after the find-card migration", () => {
    expect(
      "20261007220000_find_card_video_and_conversation.sql" <
        "20261012143000_admin_manage_therapist_profile.sql",
    ).toBe(true);
  });

  it("lets the owner or an admin delete, and keeps auth users", () => {
    expect(migration).toContain("p_confirm is distinct from 'DELETE'");
    expect(migration).toContain(
      "v_actor is distinct from p_therapist_id and not private.is_admin()",
    );
    expect(migration).toMatch(
      /delete from public\.profiles\s+where id = p_therapist_id\s+and role = 'therapist'/,
    );
    expect(migration).toContain("v_role = 'admin'");
    expect(migration).toContain("private.therapist_listing_hold");
    expect(migration).toContain("photo_key = null");
    expect(migration).not.toMatch(/delete\s+from\s+auth\.users/i);
    expect(migration).not.toMatch(/delete\s+from\s+storage\./i);
    expect(migration).toContain(
      "grant execute on function public.delete_therapist_profile(uuid, text)",
    );
    expect(migration).toContain("to authenticated");
  });

  it("keeps the definer functions out of the exposed public wrappers", () => {
    const del = migration.slice(
      migration.indexOf("create or replace function public.delete_therapist_profile"),
    );
    expect(del.slice(0, 400)).toContain("security invoker");
    expect(del.slice(0, 500)).not.toContain("security definer");
    expect(del).toContain(
      "perform private.delete_therapist_profile(p_therapist_id, p_confirm)",
    );

    const update = migration.slice(
      migration.indexOf(
        "create or replace function public.admin_update_therapist_profile",
      ),
    );
    expect(update.slice(0, 800)).toContain("security invoker");
    expect(update.slice(0, 900)).not.toContain("security definer");
    expect(update).toContain("return private.admin_update_therapist_profile(");
  });

  it("does not change role or listed, and does not store feedback", () => {
    const body = migration.slice(
      migration.indexOf("create or replace function private.admin_update_therapist_profile"),
      migration.indexOf("revoke all on function private.admin_update_therapist_profile"),
    );
    expect(body).toContain("not private.is_admin()");
    expect(body).toContain("listed is intentionally untouched");
    expect(body).not.toMatch(/set\s+role\s*=/i);
    expect(body).not.toMatch(/listed\s*=/);
    expect(body).not.toMatch(/insert into public\.feedback/);
    expect(body).toContain("Photo must stay in this profile folder");
    expect(body).toContain("Video must stay in this profile folder");
  });

  it("lets an admin read any practice and delete photo and video objects", () => {
    expect(migration).toContain("create policy rates_select_admin");
    expect(migration).toContain("create policy qualifications_select_admin");
    expect(migration).toContain("create policy photos_videos_delete_admin");
    expect(migration).toContain("bucket_id in ('photos', 'videos')");
    expect(migration).not.toMatch(/feedback_select_admin/);
  });
});
