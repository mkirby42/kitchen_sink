import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextArea, TextField } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Tag } from "@/components/ui/Tag";
import { buttonClass, eyebrowClass, fieldLabelClass } from "@/components/ui/styles";

function html(node: ReactElement) {
  return renderToStaticMarkup(node);
}

describe("shared ui", () => {
  it("uses one eggplant primary pill and one bordered secondary pill", () => {
    const primary = html(createElement(Button, { type: "submit" }, "Save"));
    expect(primary).toContain("bg-ink");
    expect(primary).toContain("rounded-full");
    expect(primary).toContain("px-6");
    expect(primary).toContain("py-2.5");
    expect(primary).toContain('type="submit"');

    const secondary = html(
      createElement(Button, { variant: "secondary", href: "/find" }, "Log in"),
    );
    expect(secondary).toContain("border-ink");
    expect(secondary).toContain("bg-paper");
    expect(secondary).toContain('href="/find"');
    expect(secondary).not.toContain("bg-clay");
    expect(buttonClass("primary")).toContain("py-2.5");
    expect(buttonClass("secondary")).toContain("py-2.5");
    expect(buttonClass("secondary", undefined, "sm")).toContain("px-3");
    expect(buttonClass("secondary", undefined, "sm")).toContain("py-2.5");
    expect(buttonClass("primary", undefined, "sm")).toContain("bg-ink");
    expect(buttonClass("gold")).toContain("bg-gold");
    expect(buttonClass("gold")).toContain("text-black");
    expect(buttonClass("primary")).toContain("font-semibold");

    const labeled = html(
      createElement(
        Button,
        { href: "/join?edit=1", "aria-label": "Edit profile" },
        "Edit",
      ),
    );
    expect(labeled).toContain('aria-label="Edit profile"');
    expect(labeled).toContain('href="/join?edit=1"');
  });

  it("uses the homepage card surface", () => {
    const card = html(createElement(Card, null, "Meet clients"));
    expect(card).toContain("rounded-card");
    expect(card).toContain("shadow-card");
    expect(card).toContain("bg-paper");
    expect(card).toContain("Meet clients");
  });

  it("selects with the eggplant homepage switch", () => {
    const control = html(
      createElement(SegmentedControl, {
        label: "Account",
        value: "signin",
        onChange() {},
        options: [
          { value: "signup", label: "Sign up" },
          { value: "signin", label: "Sign in" },
        ],
      }),
    );
    expect(control).toContain("bg-ink");
    expect(control).toContain("bg-line");
    expect(control).toContain('aria-pressed="true"');
    expect(control).not.toContain("bg-clay");
    expect(control).toContain("Sign in");

    const filled = html(
      createElement(SegmentedControl, {
        label: "Profile sections",
        value: "profile",
        fill: true,
        onChange() {},
        options: [
          { value: "profile", label: "Profile" },
          { value: "reviews", label: "Reviews" },
        ],
      }),
    );
    expect(filled).toContain("w-full");
    expect(filled).toContain("flex-1");
    expect(filled).toContain("bg-ink");
  });

  it("renders one tag pill and sentence-case fields", () => {
    const tag = html(
      createElement(Tag, { selected: true, onClick() {} }, "Anxiety"),
    );
    expect(tag).toContain("rounded-full");
    expect(tag).toContain("bg-ink");
    expect(tag).toContain('aria-pressed="true"');

    const field = html(
      createElement(TextField, { label: "Email", name: "email" }),
    );
    expect(field).toContain("Email");
    expect(field).toContain("rounded-full");
    expect(field).toContain(fieldLabelClass);
    expect(field).not.toContain("uppercase");

    const area = html(
      createElement(TextArea, { label: "About you", rows: 5 }),
    );
    expect(area).toContain("About you");
    expect(area).toContain("rounded-box");
    expect(area).not.toContain("uppercase");
    expect(eyebrowClass).not.toContain("uppercase");
    expect(fieldLabelClass).not.toContain("uppercase");
  });
});
