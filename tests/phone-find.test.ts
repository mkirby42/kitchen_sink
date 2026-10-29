import { describe, expect, it } from "vitest";
import {
  clearPhoneSheet,
  licenseFacts,
  matchSlot,
  phoneBookAction,
  phoneListFacts,
  phoneListQuote,
  phonePills,
  stackCards,
  swipeForLabel,
  therapistsFitLabel,
} from "@/lib/search/phone-find";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";

const filters: SearchFilters = {
  tags: [],
  virtual: false,
  inPerson: false,
  state: null,
};

function row(overrides: Partial<SearchRow> = {}): SearchRow {
  return {
    profile_id: "11111111-1111-4111-8111-111111111111",
    name: "Maya Chen",
    photo_key: null,
    credential: "LMFT",
    start_date_of_practice: "2017-01-01",
    min_price_cents: null,
    min_duration_minutes: null,
    virtual_practice: true,
    in_person_practice: true,
    specialty_labels: [],
    insurance_labels: ["Aetna", "Out-of-Network Superbill"],
    match_count: 0,
    matched_labels: [],
    sliding_scale: false,
    video_key: null,
    card_prompt: "who I work best with...",
    card_answer: "College students.",
    card_tag: "about",
    ...overrides,
  };
}

describe("phone find copy", () => {
  it("counts who fits and labels the pills in web order", () => {
    expect(therapistsFitLabel(0)).toBe("0 therapists fit");
    expect(therapistsFitLabel(1)).toBe("1 therapist fits");
    expect(therapistsFitLabel(4)).toBe("4 therapists fit");
    expect(phonePills(filters).map((pill) => pill.label)).toEqual([
      "Where you live",
      "Insurance",
      "What's going on",
      "In person or online",
    ]);
    expect(phonePills(filters).every((pill) => !pill.pressed)).toBe(true);
  });

  it("outlines a set filter and shows the selected value", () => {
    const pills = phonePills({
      ...filters,
      state: "TX",
      tags: ["Aetna", "Anxiety"],
      virtual: true,
    });
    expect(pills.map((pill) => [pill.label, pill.pressed])).toEqual([
      ["Texas", true],
      ["Aetna", true],
      ["What's going on", true],
      ["Online", true],
    ]);
    expect(phonePills({ ...filters, tags: ["Aetna", "BCBS"] })[1].label).toBe(
      "Insurance · 2",
    );
    const insuranceOther = phonePills({ ...filters, tags: ["Other"] });
    expect(insuranceOther[1]).toMatchObject({ label: "Other", pressed: true });
    expect(insuranceOther[2].pressed).toBe(false);
    const topicOther = phonePills({ ...filters, tags: ["Other topic"] });
    expect(topicOther[1]).toMatchObject({ label: "Insurance", pressed: false });
    expect(topicOther[2]).toMatchObject({
      label: "What's going on",
      pressed: true,
    });
    expect(phonePills({ ...filters, tags: ["Aetna", "Other"] })[1].label).toBe(
      "Insurance · 2",
    );
  });

  it("clears one sheet and leaves the others", () => {
    const current: SearchFilters = {
      tags: ["Anxiety", "Aetna", "Self Discovery"],
      virtual: true,
      inPerson: true,
      state: "TX",
    };
    expect(clearPhoneSheet(current, "topics").tags).toEqual(["Aetna"]);
    expect(clearPhoneSheet(current, "insurance").tags).toEqual([
      "Anxiety",
      "Self Discovery",
    ]);
    expect(clearPhoneSheet(current, "place")).toMatchObject({
      state: null,
      tags: current.tags,
    });
    expect(clearPhoneSheet(current, "format")).toMatchObject({
      virtual: false,
      inPerson: false,
      state: "TX",
    });
    const marked: SearchFilters = {
      ...filters,
      tags: ["Anxiety", "Aetna", "Other", "Other topic"],
    };
    expect(clearPhoneSheet(marked, "insurance").tags).toEqual([
      "Anxiety",
      "Other topic",
    ]);
    expect(clearPhoneSheet(marked, "topics").tags).toEqual(["Aetna", "Other"]);
  });

  it("prefers the who-I-work-best-with answer for the list portrait", () => {
    expect(phoneListQuote(row())).toEqual({
      label: "I work best with...",
      answer: "College students.",
    });
    expect(
      phoneListQuote(row({ card_prompt: "I work best with...", card_answer: "Grads." })),
    ).toEqual({ label: "I work best with...", answer: "Grads." });
    expect(
      phoneListQuote(
        row({
          card_prompt: "my approach to therapy is...",
          card_answer: "Collaborative.",
        }),
        [
          { prompt: "my approach to therapy is...", answer: "Collaborative." },
          { prompt: " who I work best with... ", answer: " Students. " },
        ],
      ),
    ).toEqual({ label: "I work best with...", answer: "Students." });
    expect(
      phoneListQuote(
        row({ card_prompt: "a session with me feels like...", card_answer: "Easy." }),
        [{ prompt: "a session with me feels like...", answer: "Easy." }],
      ),
    ).toEqual({ label: "a session with me feels like...", answer: "Easy." });
    expect(
      phoneListQuote(
        row({
          card_prompt: "my approach to therapy is...",
          card_answer: "Collaborative.",
        }),
        [
          { prompt: "my approach to therapy is...", answer: "Collaborative." },
          {
            prompt: "I enjoy working with people who...",
            answer: "Want a practical session.",
          },
        ],
      ),
    ).toEqual({
      label: "I work best with...",
      answer: "Want a practical session.",
    });
    expect(phoneListQuote(row({ card_prompt: " ", card_answer: "nope" }))).toBeNull();
  });

  it("shows stored facts and skips a missing year or plan", () => {
    const now = new Date("2026-10-22T12:00:00Z");
    expect(phoneListFacts(row(), filters, now)).toEqual(["Takes Aetna", "9 yrs"]);
    expect(
      phoneListFacts(row(), { ...filters, tags: ["Cigna"] }, now),
    ).toEqual(["9 yrs"]);
    expect(
      phoneListFacts(
        row({ start_date_of_practice: null, insurance_labels: [] }),
        filters,
        now,
      ),
    ).toEqual([]);
    expect(licenseFacts(["TX", "tx"], null)).toEqual(["Licensed in Texas"]);
    expect(licenseFacts([], "CA")).toEqual(["Licensed in California"]);
    expect(licenseFacts([], null)).toEqual([]);
  });

  it("prefers loaded prompts and email for the pinned consult", () => {
    expect(stackCards(row(), [])).toEqual([
      { prompt: "who I work best with...", answer: "College students." },
    ]);
    expect(
      stackCards(row(), [
        { prompt: " outside of session, I... ", answer: " I cook. " },
      ]),
    ).toEqual([{ prompt: "outside of session, I...", answer: "I cook." }]);
    expect(stackCards(row({ card_prompt: " ", card_answer: "nope" }), [])).toEqual(
      [],
    );
    expect(
      phoneBookAction([{ kind: "email" }, { kind: "phone" }]),
    ).toEqual({
      label: "Book a free consult",
      cta: "consult",
    });
    expect(phoneBookAction([{ kind: "text" }])?.label).toBe("Book a session");
    expect(phoneBookAction([])).toBeNull();
    expect(phoneBookAction(null)).toBeNull();
    expect(swipeForLabel(2, 4)).toBe("Swipe for 2 of 4");
  });

  it("has no neighbor when the set has one profile", () => {
    expect(matchSlot(["a"], "a")).toBeNull();
    expect(matchSlot(["a", "b"], "missing")).toBeNull();
    expect(matchSlot(["a", "b", "c"], "b")).toEqual({
      index: 1,
      count: 3,
      prevIndex: 0,
      nextIndex: 2,
    });
  });
});
