import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { promptAnswerClass, promptLabelClass } from "@/components/profile/prompt-type";
import { TherapistCard } from "@/components/search/TherapistCard";
import { credentialTitle, yearsPracticing } from "@/lib/therapists/display";
import {
  ADMIN_ONLY_HIDDEN_LABEL,
  DRAFT_PROFILE_LABEL,
} from "@/lib/therapists/listing";
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
    min_price_cents: 16500,
    min_duration_minutes: 75,
    virtual_practice: true,
    in_person_practice: false,
    specialty_labels: ["Anxiety"],
    insurance_labels: [],
    match_count: 0,
    matched_labels: [],
    sliding_scale: false,
    video_key: null,
    card_prompt: null,
    card_answer: null,
    card_tag: null,
    ...overrides,
  };
}

function phone(html: string) {
  const start = html.indexOf('data-find-card="phone"');
  return html.slice(start);
}

function render(
  overrides: Partial<SearchRow> = {},
  filterOverrides: Partial<SearchFilters> = {},
  cards?: { prompt: string; answer: string }[],
) {
  return renderToStaticMarkup(
    createElement(TherapistCard, {
      row: row(overrides),
      filters: { ...filters, ...filterOverrides },
      cards,
    }),
  );
}

describe("Find therapist card", () => {
  it("shows name and credential without a rate or price", () => {
    const html = render();
    expect(html).toContain("Maya Chen");
    expect(html).toContain(">MC<");
    expect(html).toContain("LMFT · Licensed marriage and family therapist");
    expect(phone(html)).toContain("Online");
    expect(phone(html)).not.toContain(">Virtual<");
    expect(phone(html)).toContain('aria-label="Get to know Maya"');
    expect(phone(html)).toContain(`${yearsPracticing("2017-01-01")} yrs`);
    expect(phone(html)).not.toContain("in practice");
    expect(html).not.toContain("Can help with");
    expect(html).not.toContain("Book free consult");
    expect(html).not.toContain("Next opening");
    expect(html).not.toContain("$");
    expect(html).not.toContain("165");
    expect(html).not.toContain("75 min");
    expect(html).not.toContain("Sliding scale");
  });

  it("omits sliding scale even when the therapist offers it", () => {
    const html = render({ sliding_scale: true, min_price_cents: 8000 });
    expect(html).toContain("Maya Chen");
    expect(html).not.toContain("$");
    expect(html).not.toContain("Sliding scale");
  });

  it("keeps specialty chips off the phone list card and shows the plan they take", () => {
    const html = render(
      {
        specialty_labels: ["Anxiety", "Trauma & PTSD"],
        insurance_labels: ["Aetna", "Cigna"],
        matched_labels: ["Anxiety", "Aetna"],
        match_count: 2,
      },
      { tags: ["Anxiety", "Depression", "Aetna"] },
    );
    expect(html).not.toContain("Can help with");
    const narrow = phone(html);
    expect(narrow).toContain("Online");
    expect(narrow).not.toContain(">Virtual<");
    expect(narrow).not.toContain("In-Person");
    expect(narrow).not.toContain(">Anxiety<");
    expect(narrow).toContain("Takes Aetna");
    expect(narrow).not.toContain(">Aetna<");
    expect(narrow).not.toContain("2 of 3 tags");
    expect(narrow).toContain("tags=Anxiety");
    expect(html).not.toContain("border-clay bg-clay");
  });

  it("does not put a stored Teens specialty on the phone card", () => {
    const html = render(
      {
        specialty_labels: ["Teens"],
        matched_labels: ["Teens"],
        match_count: 1,
      },
      { tags: ["Self Discovery"] },
    );
    expect(html).not.toContain("Can help with");
    expect(phone(html)).not.toContain("Self Discovery");
    expect(phone(html)).not.toContain("1 of 1 tag");
    expect(html).not.toContain("Teens");
  });

  it("omits specialty chips when those filters are empty and still lists the plan", () => {
    const html = render({
      specialty_labels: ["Anxiety"],
      insurance_labels: ["Aetna"],
      virtual_practice: true,
    });
    expect(phone(html)).toContain("Online");
    expect(phone(html)).not.toContain(">Virtual<");
    expect(phone(html)).not.toContain("Worry, stress or panic");
    expect(phone(html)).toContain("Takes Aetna");
    expect(phone(html)).not.toContain(">Aetna<");
    expect(phone(html)).not.toContain("Can help with");
    expect(html).not.toContain("Worry, stress or panic");
  });

  it("badges an unlisted profile and leaves listed cards unmarked", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    expect(render({ listed: false })).toContain(ADMIN_ONLY_HIDDEN_LABEL);
    expect(render({ listed: false, photo_key: "maya/photo.jpg" })).toContain(
      ADMIN_ONLY_HIDDEN_LABEL,
    );
    expect(render()).not.toContain(ADMIN_ONLY_HIDDEN_LABEL);
    expect(render({ listed: true })).not.toContain(ADMIN_ONLY_HIDDEN_LABEL);
    expect(render({ published: false })).toContain(DRAFT_PROFILE_LABEL);
    expect(render({ published: false, photo_key: "maya/photo.jpg" })).toContain(
      DRAFT_PROFILE_LABEL,
    );
    expect(render({ published: true })).not.toContain(DRAFT_PROFILE_LABEL);
  });

  it("fills a 4:5 frame with the photo and no play control when there is no intro video", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = render({ photo_key: "maya/photo.jpg", video_key: null });
    const narrow = phone(html);
    expect(narrow).toContain("aspect-[4/5]");
    expect(narrow).toContain("object-cover");
    expect(narrow).not.toContain("size-[4.5rem]");
    expect(narrow).toContain("/object/public/photos/maya/photo.jpg");
    expect(narrow).not.toContain("Play intro video");
    expect(narrow).not.toContain("<video");
    expect(narrow).not.toContain("0:30");
    expect(narrow).not.toMatch(/<img[^>]*rounded-full/);
    expect(narrow).toContain('aria-label="Get to know Maya"');
    expect(html).toContain('href="/t/11111111-1111-4111-8111-111111111111"');
    expect(html).not.toContain("aspect-[9/16]");
    expect(html).not.toContain("sm:flex-row");
  });

  it("shows a 4:5 poster and centered play control without loading the video file", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = render({
      photo_key: "maya/photo.jpg",
      video_key: "maya/intro.mp4",
    });
    const narrow = phone(html);
    expect(narrow).toContain("aspect-[4/5]");
    expect(narrow).toContain("object-cover");
    expect(narrow).not.toContain("size-[4.5rem]");
    expect(narrow).toContain("/object/public/photos/maya/photo.jpg");
    expect(narrow).not.toContain("intro.mp4");
    expect(narrow).not.toContain("<video");
    expect(narrow).not.toContain("autoPlay");
    expect(narrow).not.toContain("autoplay");
    expect(narrow).toContain('aria-label="Play intro video for Maya Chen"');
    expect(narrow).toContain("bg-transparent");
    expect(narrow).toContain("border-paper/80");
    expect(narrow).not.toContain("bg-clay");
    expect(narrow).toContain('aria-label="Get to know Maya"');
    expect(narrow).not.toContain("0:30");
    expect(narrow).not.toContain("→");
    expect(html).toContain('href="/t/11111111-1111-4111-8111-111111111111"');
    expect(html).toContain("rounded-card");
    expect(html).toContain("shadow-card");
    expect(html.match(/<article[^>]*>/)?.[0]).not.toContain("border");
    expect(html).not.toContain("aspect-[9/16]");
    expect(html).not.toContain("sm:flex-row");
    expect(html).not.toContain("sm:w-52");
    expect(html.match(/<article/g)).toHaveLength(1);
    expect(narrow.indexOf(">Maya Chen<")).toBeGreaterThan(narrow.indexOf("<a "));
  });

  it("shows the first conversation card and skips a blank one", () => {
    const withCard = render({
      card_prompt: "who I work best with...",
      card_answer: "College students and early-career professionals.",
      card_tag: "about",
    });
    expect(withCard).toContain("who I work best with...");
    expect(withCard).toContain("College students and early-career professionals.");
    expect(withCard).not.toContain("I WORK BEST WITH...");
    const narrow = phone(withCard);
    expect(narrow).toContain(promptLabelClass);
    expect(narrow).toContain(promptAnswerClass);
    expect(narrow).not.toContain("text-[15px] leading-relaxed text-body");
    const promptAt = narrow.indexOf("who I work best with...");
    const answerAt = narrow.indexOf("College students and early-career professionals.");
    expect(narrow).toContain('aria-label="Get to know Maya"');
    expect(promptAt).toBeGreaterThan(-1);
    expect(answerAt).toBeGreaterThan(promptAt);

    const blank = render({
      card_prompt: "   ",
      card_answer: "unused",
    });
    expect(blank).not.toContain("unused");
  });

  it("keeps the phone list card beside the intro and the conversation answer", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = render(
      {
        name: "Dr. Travis White",
        credential: "PsyD",
        photo_key: "travis/photo.jpg",
        video_key: "travis/intro.mp4",
        virtual_practice: true,
        in_person_practice: true,
        specialty_labels: ["Anxiety", "Trauma & PTSD"],
        insurance_labels: ["Aetna"],
        matched_labels: ["Anxiety"],
        match_count: 1,
        card_prompt: "who I work best with...",
        card_answer: "I help college students find their way.",
        card_tag: "about",
      },
      { tags: ["Anxiety"] },
    );
    expect(html).not.toContain("Can help with");
    expect(html).not.toContain("I WORK BEST WITH...");
    expect(html).not.toContain("Watch intro");
    expect(html).not.toContain("0:30");

    const narrow = phone(html);
    expect(narrow).toContain('aria-label="Get to know Travis"');
    expect(narrow).toContain('aria-label="Play intro video for Dr. Travis White"');
    expect(narrow).toContain("aspect-[4/5]");
    expect(narrow).toContain("object-cover");
    expect(narrow).not.toContain("size-[4.5rem]");
    expect(narrow).not.toContain("intro.mp4");
    expect(narrow).toContain("PsyD · Licensed psychologist");
    expect(narrow).not.toContain("Licensed Psychologist");
    expect(narrow).not.toContain(" yrs");
    expect(narrow).not.toContain("Takes Aetna");
    expect(narrow).not.toContain("Watch Travis");
    expect(narrow).not.toContain("→");
    expect(narrow).toContain("I work best with...");
    expect(narrow).not.toContain("who I work best with...");
    expect(narrow).toContain("I help college students find their way.");
    expect(narrow).toContain("font-display");
    expect(narrow).not.toContain("1 of 1 tag");
    expect(narrow).not.toContain(">Anxiety<");
    const phoneFormats = narrow.slice(
      narrow.indexOf("data-find-formats"),
      narrow.indexOf("I work best with..."),
    );
    expect(phoneFormats).toContain("In person · Online");
    expect(phoneFormats).not.toContain("Virtual");
    expect(narrow).toContain(
      'href="/t/11111111-1111-4111-8111-111111111111?tags=Anxiety"',
    );
  });

  it("uses the saved who-I-work-best-with card when it is not the first prompt", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = phone(
      render(
        {
          photo_key: "maya/photo.jpg",
          card_prompt: "my approach to therapy is...",
          card_answer: "Collaborative.",
        },
        {},
        [
          { prompt: "my approach to therapy is...", answer: "Collaborative." },
          {
            prompt: "who I work best with...",
            answer: "College students finding their way.",
          },
        ],
      ),
    );
    expect(html).toContain("I work best with...");
    expect(html).toContain("College students finding their way.");
    expect(html).not.toContain("Collaborative.");
    expect(html).not.toContain("my approach to therapy is...");
  });

  it("uses a 4:5 video frame instead of initials when there is no photo", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = render({
      photo_key: null,
      video_key: "maya/intro.mp4",
    });
    const narrow = phone(html);
    const still = "/object/public/videos/maya/intro.mp4#t=0.1";

    expect(narrow).toContain("data-video-still");
    expect(narrow).toContain(still);
    expect(narrow).toContain('preload="metadata"');
    expect(narrow).toContain("aspect-[4/5]");
    expect(narrow).not.toContain("size-[4.5rem]");
    expect(narrow).toContain("object-cover");
    expect(narrow).toContain('aria-label="Play intro video for Maya Chen"');
    expect(narrow).not.toContain(">MC<");
    expect(narrow).not.toContain("<img");
    expect(narrow).not.toContain("autoplay");
    expect(narrow).not.toContain("0:30");
    expect(narrow).not.toMatch(/<video[^>]*\scontrols[\s=]/);
    expect(narrow).toContain('aria-label="Get to know Maya"');
    expect(html).not.toContain("Watch intro");
  });

  it("omits years when the practice start date is missing", () => {
    const html = phone(
      render({ start_date_of_practice: null, credential: "PsyD" }),
    );
    expect(html).toContain("PsyD · Licensed psychologist");
    expect(html).not.toContain(" yrs");
  });
});

describe("credential titles", () => {
  it("expands the licensed codes the cards show", () => {
    expect(credentialTitle("PsyD")).toBe("PsyD · Licensed psychologist");
    expect(credentialTitle("LMFT")).toBe(
      "LMFT · Licensed marriage and family therapist",
    );
    expect(credentialTitle("LCSW")).toBe("LCSW · Licensed clinical social worker");
    expect(credentialTitle("LPC")).toBe("LPC · Licensed professional counselor");
    expect(credentialTitle("PhD")).toBe("PhD");
    expect(credentialTitle("MD")).toBe("MD");
    expect(credentialTitle("  ")).toBeNull();
    expect(credentialTitle(null)).toBeNull();
  });
});
