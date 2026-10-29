import { describe, expect, it } from "vitest";
import {
  CONVERSATION_PROMPTS,
  ENJOY_WORKING_PROMPT,
  builderCardsFromSaved,
  isRetiredPrompt,
  isWorkBestPrompt,
  publicConversationPrompt,
} from "@/lib/join/cards";
import { draftFromRows } from "@/lib/join/load-draft";

const prompts = CONVERSATION_PROMPTS.map((item) => item.prompt);

describe("conversation prompts", () => {
  it("groups Christine's list by section", () => {
    const byTag = (tag: string) =>
      CONVERSATION_PROMPTS.filter((item) => item.tag === tag).map(
        (item) => item.prompt,
      );
    expect(byTag("approach")).toEqual([
      "my approach to therapy is...",
      "my personal philosophy in therapy is...",
    ]);
    expect(byTag("session_vibe")).toEqual([
      "a session with me feels like...",
      "what you can expect in our first session together...",
    ]);
    expect(byTag("specialty")).toEqual([
      "I specialize in unpacking...",
      "people often come to me because...",
    ]);
    expect(byTag("about")).toEqual([
      ENJOY_WORKING_PROMPT,
      "I got into this work because...",
      "outside of session, I...",
    ]);
    expect(byTag("outcome")).toEqual([
      "I know therapy is working when...",
      "you'll know it's working when...",
    ]);
    expect(prompts).not.toContain("who I work best with...");
    expect(prompts).not.toContain("before we start, you should know...");
    expect(prompts).not.toContain("clients say I'm especially good at...");
  });

  it("loads legacy work-best and outside-of-session answers into the new slots", () => {
    expect(
      builderCardsFromSaved([
        {
          prompt: " who I work best with... ",
          answer: " College students. ",
          tag: "about",
        },
        {
          prompt: "outside of session, I...",
          answer: "I cook.",
          tag: "session_vibe",
        },
      ]),
    ).toEqual([
      {
        prompt: ENJOY_WORKING_PROMPT,
        answer: " College students. ",
        tag: "about",
      },
      {
        prompt: "outside of session, I...",
        answer: "I cook.",
        tag: "about",
      },
    ]);
    expect(
      builderCardsFromSaved([
        { prompt: "I work best with...", answer: "Parents.", tag: "about" },
      ]),
    ).toEqual([
      { prompt: ENJOY_WORKING_PROMPT, answer: "Parents.", tag: "about" },
    ]);
  });

  it("maps only the first legacy work-best answer when the new slot is empty", () => {
    expect(
      builderCardsFromSaved([
        { prompt: "who I work best with...", answer: "Students.", tag: "about" },
        { prompt: "I work best with...", answer: "Parents.", tag: "about" },
      ]),
    ).toEqual([
      { prompt: ENJOY_WORKING_PROMPT, answer: "Students.", tag: "about" },
      { prompt: "I work best with...", answer: "Parents.", tag: "custom" },
    ]);
  });

  it("keeps a second legacy answer and retired prompts as custom cards", () => {
    const cards = builderCardsFromSaved([
      { prompt: "who I work best with...", answer: "Students.", tag: "about" },
      { prompt: "I work best with...", answer: "Parents.", tag: "about" },
      {
        prompt: ENJOY_WORKING_PROMPT,
        answer: "Want practical tools.",
        tag: "about",
      },
      {
        prompt: "before we start, you should know...",
        answer: "I take notes.",
        tag: "about",
      },
      {
        prompt: "clients say I'm especially good at...",
        answer: "Listening.",
        tag: "outcome",
      },
      {
        prompt: "what my dog thinks of therapy...",
        answer: "He naps.",
        tag: "custom",
      },
    ]);
    expect(cards).toEqual([
      {
        prompt: "who I work best with...",
        answer: "Students.",
        tag: "custom",
      },
      { prompt: "I work best with...", answer: "Parents.", tag: "custom" },
      {
        prompt: ENJOY_WORKING_PROMPT,
        answer: "Want practical tools.",
        tag: "about",
      },
      {
        prompt: "before we start, you should know...",
        answer: "I take notes.",
        tag: "custom",
      },
      {
        prompt: "clients say I'm especially good at...",
        answer: "Listening.",
        tag: "custom",
      },
      {
        prompt: "what my dog thinks of therapy...",
        answer: "He naps.",
        tag: "custom",
      },
    ]);
    const saved = cards.filter((card) => card.prompt.trim() && card.answer.trim());
    expect(saved).toHaveLength(6);
    expect(saved.map((card) => card.answer)).toEqual([
      "Students.",
      "Parents.",
      "Want practical tools.",
      "I take notes.",
      "Listening.",
      "He naps.",
    ]);
  });

  it("keeps the stored public label for legacy work-best and retired prompts", () => {
    expect(publicConversationPrompt(" who I work best with... ")).toBe(
      "who I work best with...",
    );
    expect(publicConversationPrompt("I work best with...")).toBe(
      "I work best with...",
    );
    expect(publicConversationPrompt("before we start, you should know...")).toBe(
      "before we start, you should know...",
    );
    expect(isWorkBestPrompt("I enjoy working with people who...")).toBe(true);
    expect(isWorkBestPrompt("who I work best with...")).toBe(true);
    expect(isWorkBestPrompt("I work best with...")).toBe(true);
    expect(isWorkBestPrompt("my approach to therapy is...")).toBe(false);
    expect(isRetiredPrompt("clients say I'm especially good at...")).toBe(true);
    expect(isRetiredPrompt(ENJOY_WORKING_PROMPT)).toBe(false);
  });

  it("maps those saved rows when the editor loads a draft", () => {
    const draft = draftFromRows({
      email: "maya@example.com",
      profile: {
        name: "Maya Chen",
        email: "maya@example.com",
        phone: null,
        about_me: null,
        photo_key: null,
        video_key: null,
      },
      therapist: {
        credential: "LMFT",
        start_date_of_practice: "2017-01-01",
        open_to_new_clients: true,
        virtual_practice: true,
        in_person_practice: false,
      },
      licenses: [],
      qualifications: [],
      rates: [],
      tags: [],
      items: [
        {
          prompt: "who I work best with...",
          answer: "Students.",
          tag: "about",
        },
        {
          prompt: "before we start, you should know...",
          answer: "I take notes.",
          tag: "about",
        },
      ],
      location: null,
    });
    expect(draft.cards).toEqual([
      { prompt: ENJOY_WORKING_PROMPT, answer: "Students.", tag: "about" },
      {
        prompt: "before we start, you should know...",
        answer: "I take notes.",
        tag: "custom",
      },
    ]);
  });
});
