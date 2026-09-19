import { describe, expect, it } from "vitest";
import { homeCtas } from "@/lib/home";
import { routes } from "@/lib/routes";

describe("homeCtas", () => {
  it("lets a returning therapist sign in from home", () => {
    expect(homeCtas({ signedIn: false, therapistId: null })).toEqual([
      { href: routes.find, label: "Find a therapist", variant: "primary" },
      {
        href: routes.join,
        label: "Join as a therapist",
        variant: "secondary",
      },
      {
        href: routes.joinSignIn,
        label: "Log in as a therapist",
        variant: "secondary",
      },
    ]);
  });

  it("sends a signed-in therapist to their profile instead of login", () => {
    expect(
      homeCtas({
        signedIn: true,
        therapistId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual([
      { href: routes.find, label: "Find a therapist", variant: "primary" },
      {
        href: "/t/11111111-1111-4111-8111-111111111111",
        label: "My profile",
        variant: "secondary",
      },
    ]);
  });
});
