import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { HelperUpload } from "@/components/admin/HelperUpload";
import { SiteHeader } from "@/components/SiteHeader";
import type { AdminTherapist } from "@/lib/admin/media";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/media",
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
}));

const therapist: AdminTherapist = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Dr. Maya Chen",
  email: "maya@kitchensink.demo",
  credential: "LMFT",
  openToNewClients: true,
  photoKey: "11111111-1111-4111-8111-111111111111/photo.jpg",
  videoKey: null,
};

describe("admin helper upload UI", () => {
  it("lists a therapist and uploads into the selected profile", () => {
    const idle = renderToStaticMarkup(<HelperUpload therapists={[therapist]} />);
    expect(idle).toContain("Upload therapist media");
    expect(idle).toContain("Dr. Maya Chen");
    expect(idle).toContain("maya@kitchensink.demo");
    expect(idle).toContain("No intro video");
    expect(idle).toContain("Pick a therapist to upload.");
    expect(idle).not.toContain("Choose a photo…");

    const selected = renderToStaticMarkup(
      <HelperUpload therapists={[therapist]} initialSelectedId={therapist.id} />,
    );
    expect(selected).toContain("Replace photo…");
    expect(selected).toContain("Choose a video…");
    expect(selected).toContain("JPEG, PNG, WebP, or GIF · up to 5MB.");
    expect(selected).toContain("MP4, WebM, or MOV · up to 50MB.");
    expect(selected).toContain(`/t/${therapist.id}`);
  });

  it("signs ops in without a public signup form", () => {
    const html = renderToStaticMarkup(<AdminAuth />);
    expect(html).toContain("Sign in to upload media");
    expect(html).toContain("Sign in →");
    expect(html).not.toContain("Sign up");
    expect(html).not.toContain("Create account");
  });

  it("shows Uploads in the header for an admin", () => {
    const html = renderToStaticMarkup(
      <SiteHeader
        initialNavUser={{
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          role: "admin",
        }}
      />,
    );
    expect(html).toContain('href="/admin/media"');
    expect(html).toContain("Uploads");
    expect(html).not.toContain("Interest");
    expect(html).not.toContain("My profile");
  });
});
