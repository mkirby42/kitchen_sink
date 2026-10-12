import { describe, expect, it } from "vitest";
import {
  buildProfileStartAdminEmail,
  buildProfileStartReadyEmail,
} from "@/lib/profile-start/email";
import {
  normalizeProfileLink,
  parseProfileStart,
} from "@/lib/profile-start/validate";

describe("parseProfileStart", () => {
  it("keeps a name, email, and https links", () => {
    expect(
      parseProfileStart({
        name: "Ada Lovelace",
        email: "Ada@Practice.com",
        links: ["psychologytoday.com/us/therapists/ada", "https://ada.example/about"],
      }),
    ).toEqual({
      ok: true,
      honeypot: false,
      name: "Ada Lovelace",
      email: "ada@practice.com",
      links: [
        "https://psychologytoday.com/us/therapists/ada",
        "https://ada.example/about",
      ],
    });
  });

  it("drops a filled honeypot without storing it", () => {
    expect(
      parseProfileStart({
        name: "Ada",
        email: "ada@practice.com",
        links: ["https://ada.example"],
        company: "spam co",
      }),
    ).toEqual({ ok: true, honeypot: true });
  });

  it("rejects a missing link and a non-url", () => {
    expect(
      parseProfileStart({
        name: "Ada",
        email: "ada@practice.com",
        links: ["  "],
      }),
    ).toMatchObject({ ok: false });
    expect(
      parseProfileStart({
        name: "Ada",
        email: "ada@practice.com",
        links: ["javascript:alert(1)"],
      }),
    ).toMatchObject({ ok: false });
    expect(normalizeProfileLink("not a link")).toBeNull();
  });
});

describe("profile start email", () => {
  it("mails the ops inbox and does not fetch the links", () => {
    const message = buildProfileStartAdminEmail({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Ada Lovelace",
      email: "ada@practice.com",
      links: ["https://ada.example"],
      createdAt: "2026-10-10T00:00:00.000Z",
      queueUrl: "https://kitchen-sink-tau.vercel.app/admin/starts",
    });
    expect(message.to).toBe("chrislo5240@gmail.com");
    expect(message.replyTo).toBe("ada@practice.com");
    expect(message.text).toContain("https://ada.example");
    expect(message.text).toContain("not fetched");
    expect(message.text).toContain("/admin/starts");
  });

  it("sends the therapist a login link and a sign-in link", () => {
    const message = buildProfileStartReadyEmail({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Ada",
      email: "ada@practice.com",
      actionLink: "https://project.supabase.co/auth/v1/verify?token=abc",
      signInUrl: "https://kitchen-sink-tau.vercel.app/join?mode=signin",
      nonce: "1",
    });
    expect(message.to).toBe("ada@practice.com");
    expect(message.text).toContain("Nothing goes live until you approve it.");
    expect(message.text).toContain("https://project.supabase.co/auth/v1/verify?token=abc");
    expect(message.text).toContain("/join?mode=signin");
  });
});
