import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContactCtas } from "@/components/profile/ContactCtas";
import { ContactSheet } from "@/components/profile/ContactSheet";
import type { ConsultBookAction, ContactAction } from "@/lib/therapists/load";

const contact: ContactAction[] = [
  {
    kind: "email",
    label: "Email",
    href: "mailto:travis@example.com",
    value: "travis@example.com",
  },
  {
    kind: "phone",
    label: "Call",
    href: "tel:+15125550199",
    value: "(512) 555-0199",
  },
  {
    kind: "text",
    label: "Text",
    href: "sms:+15125550199",
    value: "(512) 555-0199",
  },
];

const actions: ConsultBookAction[] = [
  { kind: "consult", label: "Free Consult", href: "mailto:travis@example.com" },
  { kind: "book", label: "Book a Session", href: "tel:+15125550199" },
];

function render(
  props: { actions?: ConsultBookAction[]; contact?: ContactAction[] } = {},
) {
  return renderToStaticMarkup(
    createElement(ContactCtas, {
      name: "Travis",
      actions: props.actions ?? actions,
      contact: props.contact ?? contact,
    }),
  );
}

describe("ContactCtas", () => {
  it("keeps an in-flow set for md+ and a fixed safe-area dock below md", () => {
    const html = render();
    expect(html).toContain('data-cta-placement="inline"');
    expect(html).toContain("hidden md:grid");
    expect(html).toContain('data-cta-placement="dock"');
    expect(html).toContain("fixed inset-x-0 bottom-0");
    expect(html).toContain("md:hidden");
    expect(html).toContain("env(safe-area-inset-bottom)");
    expect(html.match(/Free Consult/g)).toHaveLength(2);
    expect(html.match(/Book a Session/g)).toHaveLength(2);
    expect(html).toContain("border-ink");
    expect(html).toContain("bg-heading");
    expect(html).toContain("text-[16px]");
    expect(html).toContain("whitespace-nowrap");
    expect(html).toContain("px-3");
    expect(html).not.toContain("pine");
    expect(html).not.toContain("border-2");
  });

  it("renders nothing without contact or actions", () => {
    expect(render({ contact: [] })).toBe("");
    expect(render({ actions: [] })).toBe("");
  });

  it("keeps mailto off the booking buttons until the sheet is open", () => {
    const html = render();
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("sms:");
  });
});

describe("ContactSheet", () => {
  it("lists email, call, and text, and only those rows leave the page", () => {
    const html = renderToStaticMarkup(
      createElement(ContactSheet, {
        open: true,
        name: "Travis",
        contact,
        onClose() {},
      }),
    );
    expect(html).toContain('data-contact-sheet=""');
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Reach Travis");
    expect(html).toContain("Kitchen Sink doesn&#x27;t book sessions");
    expect(html).toContain('href="mailto:travis@example.com"');
    expect(html).toContain('href="tel:+15125550199"');
    expect(html).toContain('href="sms:+15125550199"');
    expect(html).toContain(">Email<");
    expect(html).toContain(">Call<");
    expect(html).toContain(">Text<");
    expect(html).toContain(">Close<");
  });

  it("stays closed until a booking button opens it", () => {
    const html = renderToStaticMarkup(
      createElement(ContactSheet, {
        open: false,
        name: "Travis",
        contact,
        onClose() {},
      }),
    );
    expect(html).toBe("");
  });
});
