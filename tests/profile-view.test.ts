import { describe, expect, it } from "vitest";
import {
  officeAddressLines,
  profileOffice,
} from "@/lib/therapists/display";
import {
  consultBookActions,
  contactActions,
  givenName,
  inNetworkInsurance,
  licenseCaptions,
  licenseLine,
  reviewAverage,
  slidingScaleLabel,
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

  it("writes a hero license caption from the state name and number", () => {
    expect(
      licenseCaptions([
        { number: "38047", state: "TX" },
        { number: " 12345 ", state: "ca" },
      ]),
    ).toEqual([
      "Licensed by State of Texas / 38047",
      "Licensed by State of California / 12345",
    ]);
    expect(licenseCaptions([{ number: "999", state: "DC" }])).toEqual([
      "Licensed by the District of Columbia / 999",
    ]);
    expect(licenseCaptions([{ number: "  ", state: "TX" }])).toEqual([]);
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

  it("shows an in-person office and hides a blank or virtual-only address", () => {
    const saved = {
      address: "  1102 West 6th Street, Austin  ",
      address2: " ",
      state: "TX",
      zip: "78703",
    };
    expect(profileOffice(true, saved)).toEqual({
      address: "1102 West 6th Street, Austin",
      address2: null,
      state: "TX",
      zip: "78703",
    });
    expect(officeAddressLines(profileOffice(true, saved))).toEqual([
      "1102 West 6th Street, Austin",
      "TX 78703",
    ]);
    expect(
      officeAddressLines(
        profileOffice(true, {
          address: "1102 West 6th Street, Austin",
          address2: "Suite 4",
          state: "TX",
          zip: "78703",
        }),
      ),
    ).toEqual(["1102 West 6th Street, Austin", "Suite 4", "TX 78703"]);
    expect(profileOffice(false, saved)).toBeNull();
    expect(
      profileOffice(true, { address: "   ", state: "TX", zip: "78703" }),
    ).toBeNull();
    expect(profileOffice(true, null)).toBeNull();
    expect(officeAddressLines(null)).toEqual([]);
  });

  it("labels a sliding scale range, a single bound, or availability", () => {
    expect(slidingScaleLabel(true, 9000, 12000)).toBe("$90-120");
    expect(slidingScaleLabel(false, 9000, 12000)).toBe("$90-120");
    expect(slidingScaleLabel(true, 8000, null)).toBe("$80");
    expect(slidingScaleLabel(true, null, null)).toBe("Available");
    expect(slidingScaleLabel(false, null, null)).toBeNull();
  });
});
