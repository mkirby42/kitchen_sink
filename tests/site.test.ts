import { describe, expect, it } from "vitest";
import {
  AI_USER_AGENTS,
  PRIVATE_PATH_PREFIX,
  canonicalOrigin,
  llmsTxt,
  originFromRequest,
  robotsPolicy,
  sitemapEntries,
  therapistMetaDescription,
  therapistProfilePath,
} from "@/lib/site";

const ORIGIN = "https://kitchen-sink-tau.vercel.app";

describe("robots policy", () => {
  const policy = robotsPolicy(ORIGIN);

  it("allows the site and points at this host's sitemap", () => {
    expect(policy.sitemap).toBe(`${ORIGIN}/sitemap.xml`);
    const rules = Array.isArray(policy.rules) ? policy.rules : [policy.rules];
    expect(rules.map((rule) => rule.userAgent)).toEqual([
      "*",
      [...AI_USER_AGENTS],
    ]);
    for (const rule of rules) {
      expect(rule.allow).toBe("/");
      expect(rule.disallow).toBe(PRIVATE_PATH_PREFIX);
      expect(rule.disallow).not.toBe("/");
    }
  });
});

describe("sitemap entries", () => {
  it("lists the public pages and open therapist profiles", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const urls = sitemapEntries(ORIGIN, [id, id, "not-an-id"]).map(
      (entry) => entry.url,
    );
    expect(urls).toEqual([
      ORIGIN,
      `${ORIGIN}/find`,
      `${ORIGIN}/join`,
      `${ORIGIN}/t/${id}`,
    ]);
    expect(urls.some((url) => url.includes("/admin"))).toBe(false);
  });

  it("only accepts therapist ids that are uuids", () => {
    expect(therapistProfilePath("maya")).toBeNull();
    expect(therapistProfilePath("11111111-1111-4111-8111-111111111111")).toBe(
      "/t/11111111-1111-4111-8111-111111111111",
    );
  });
});

describe("llms.txt", () => {
  const body = llmsTxt(ORIGIN);

  it("describes the product and links the public pages", () => {
    expect(body.startsWith("# Kitchen Sink\n")).toBe(true);
    expect(body).toContain("Kitchen Sink (Talk Shoppe)");
    expect(body).toContain("does not book appointments");
    expect(body).toContain(`[Home](${ORIGIN})`);
    expect(body).toContain(`[Find a therapist](${ORIGIN}/find)`);
    expect(body).toContain(`[Join as a therapist](${ORIGIN}/join)`);
    expect(body).toContain(`${ORIGIN}/sitemap.xml`);
    expect(body).not.toContain("/admin");
  });
});

describe("canonical origin", () => {
  it("falls back to the live host", () => {
    const previous = process.env.SITE_URL;
    const vercelEnv = process.env.VERCEL_ENV;
    delete process.env.SITE_URL;
    delete process.env.VERCEL_ENV;
    try {
      expect(canonicalOrigin()).toBe(ORIGIN);
    } finally {
      if (previous === undefined) delete process.env.SITE_URL;
      else process.env.SITE_URL = previous;
      if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = vercelEnv;
    }
  });

  it("reads the request host for sitemap links", () => {
    expect(originFromRequest("localhost:3000", null)).toBe(
      "http://localhost:3000",
    );
    expect(
      originFromRequest("kitchen-sink-tau.vercel.app", "https"),
    ).toBe("https://kitchen-sink-tau.vercel.app");
    expect(originFromRequest("bad host", "https")).toBeNull();
  });
});

describe("therapist meta description", () => {
  it("names the credential and a few specialties", () => {
    expect(
      therapistMetaDescription({
        name: "Maya Chen",
        credential: "LMFT",
        specialties: ["Anxiety", "Trauma & PTSD", "Grief & Loss", "Teens"],
      }),
    ).toBe(
      "Maya Chen, LMFT. Specialties include Anxiety, Trauma & PTSD, Grief & Loss. Profile on Kitchen Sink.",
    );
  });
});
