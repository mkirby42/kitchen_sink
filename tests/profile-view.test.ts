import { describe, expect, it } from "vitest";
import {
  consultBookActions,
  contactActions,
  givenName,
  inNetworkInsurance,
  licenseLine,
  reviewAverage,
  telHref,
} from "@/lib/therapists/load";

describe("profile view helpers", () => {
  it("uses the given name after a title", () => {
    expect(givenName("Dr. Maya Chen")).toBe("Maya");
    expect(givenName("Maya Chen")).toBe("Maya");
  });

  it("formats licenses as number plus state", () => {
    expect(
      licenseLine([
        { number: "MFC 112938", state: "CA" },
        { number: "12345", state: "NY" },
      ]),
    ).toBe("Lic. #MFC 112938 (CA) · #12345 (NY)");
  });

  it("builds mailto and tel contact actions from outreach tags", () => {
    const actions = contactActions({
      email: "maya@kitchensink.demo",
      phone: "(415) 555-0199",
      outreach: ["email", "phone", "text"],
    });
    expect(actions.map((a) => a.href)).toEqual([
      "mailto:maya@kitchensink.demo",
      "tel:+14155550199",
      "sms:+14155550199",
    ]);
    expect(actions.map((a) => a.value)).toEqual([
      "maya@kitchensink.demo",
      "(415) 555-0199",
      "(415) 555-0199",
    ]);
    expect(actions.some((a) => /book a session|calendar/i.test(a.label))).toBe(
      false,
    );
  });

  it("maps outreach to screenshot consult/book pills over mailto and tel", () => {
    const ctas = consultBookActions(
      contactActions({
        email: "maya@kitchensink.demo",
        phone: "(415) 555-0199",
        outreach: ["email", "phone", "text"],
      }),
    );
    expect(ctas).toEqual([
      {
        kind: "consult",
        label: "Free Consult",
        href: "mailto:maya@kitchensink.demo",
      },
      {
        kind: "book",
        label: "Book a Session",
        href: "tel:+14155550199",
      },
    ]);
  });

  it("builds a tel href from a formatted US number", () => {
    expect(telHref("(415) 555-0199")).toBe("tel:+14155550199");
  });

  it("keeps in-network insurers separate from superbill tags", () => {
    expect(
      inNetworkInsurance([
        "Aetna",
        "BCBS",
        "Cigna",
        "Out-of-Network Superbill",
      ]),
    ).toEqual(["Aetna", "BCBS", "Cigna"]);
  });

  it("averages review stars", () => {
    expect(reviewAverage([5, 5, 4])).toBe(4.7);
  });
});
