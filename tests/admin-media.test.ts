import { describe, expect, it } from "vitest";
import {
  filterTherapists,
  isTherapistMediaKey,
  normalizeAdminTherapists,
  type AdminTherapist,
} from "@/lib/admin/media";
import { parseProfileRole } from "@/lib/role";
import { joinMediaPath, mediaFileError } from "@/lib/join/media";

const MAYA = "11111111-1111-4111-8111-111111111111";

const rows: AdminTherapist[] = [
  {
    id: MAYA,
    name: "Dr. Maya Chen",
    email: "maya@kitchensink.demo",
    credential: "LMFT",
    openToNewClients: true,
    listed: true,
    photoKey: `${MAYA}/photo.jpg`,
    videoKey: null,
  },
  {
    id: "55555555-5555-4555-8555-555555555001",
    name: "Jordan Lee",
    email: "jordan@kitchensink.demo",
    credential: "LCSW",
    openToNewClients: false,
    listed: true,
    photoKey: null,
    videoKey: null,
  },
];

describe("admin helper media", () => {
  it("accepts one file under the therapist prefix and rejects escapes", () => {
    const path = joinMediaPath(MAYA, "photo", "head shot.png", 10);
    expect(path).toBe(`${MAYA}/photo-10-head_shot.png`);
    expect(isTherapistMediaKey(MAYA, path)).toBe(true);
    expect(isTherapistMediaKey(MAYA, `${MAYA}/a/b.jpg`)).toBe(false);
    expect(isTherapistMediaKey(MAYA, `${MAYA}/..`)).toBe(false);
    expect(isTherapistMediaKey(MAYA, `${MAYA}/../other.jpg`)).toBe(false);
    expect(isTherapistMediaKey(rows[1].id, path)).toBe(false);
    expect(isTherapistMediaKey("not-a-uuid", `${MAYA}/photo.jpg`)).toBe(false);
  });

  it("keeps join photo and video limits", () => {
    expect(mediaFileError("photo", { type: "image/gif", size: 10 })).toBeNull();
    expect(mediaFileError("photo", { type: "image/svg+xml", size: 10 })).toMatch(
      /JPEG/,
    );
    expect(mediaFileError("video", { type: "video/mp4", size: 50 * 1024 * 1024 + 1 })).toMatch(
      /50MB/,
    );
    expect(mediaFileError("video", { type: "video/quicktime", size: 1000 })).toBeNull();
  });

  it("filters by name or email and keeps closed therapists", () => {
    expect(filterTherapists(rows, "maya@").map((row) => row.name)).toEqual([
      "Dr. Maya Chen",
    ]);
    expect(filterTherapists(rows, "jordan").map((row) => row.openToNewClients)).toEqual([
      false,
    ]);
    expect(filterTherapists(rows, "   ")).toHaveLength(2);
  });

  it("normalizes the therapists embed from either object or array", () => {
    const normalized = normalizeAdminTherapists([
      {
        id: rows[1].id,
        name: "Jordan Lee",
        email: "jordan@kitchensink.demo",
        photo_key: null,
        video_key: null,
        therapists: [{ credential: "LCSW", open_to_new_clients: false, listed: false }],
      },
      {
        id: MAYA,
        name: "Dr. Maya Chen",
        email: "maya@kitchensink.demo",
        photo_key: `${MAYA}/photo.jpg`,
        video_key: null,
        therapists: { credential: "LMFT", open_to_new_clients: true },
      },
    ]);
    expect(normalized.map((row) => row.name)).toEqual([
      "Dr. Maya Chen",
      "Jordan Lee",
    ]);
    expect(normalized[1]?.credential).toBe("LCSW");
    expect(normalized[0]?.listed).toBe(true);
    expect(normalized[1]?.listed).toBe(false);
  });

  it("treats admin as a profile role", () => {
    expect(parseProfileRole("admin")).toBe("admin");
    expect(parseProfileRole("therapist")).toBe("therapist");
    expect(parseProfileRole("owner")).toBeNull();
  });
});
