export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Fraunces 500. Homepage and other page headlines. */
export const pageTitleClass =
  "font-display text-[2.25rem] leading-[1.15] font-medium tracking-tight text-black sm:text-[2.75rem]";

/** Fraunces 500. Section headlines outside the profile scale. Color is applied at the call site. */
export const sectionTitleClass =
  "font-display text-[1.75rem] leading-snug font-medium tracking-tight sm:text-[2.125rem]";

/**
 * Profile page heading (“Get to know Travis”).
 * 30px on a phone, 36px / 42px from md up. Fraunces 500, one purple.
 */
export const profilePageHeadingClass =
  "font-display text-[30px] leading-[36px] font-medium text-heading md:text-[36px] md:leading-[42px]";

/**
 * Profile section heading (“How Travis works”).
 * 22px on a phone, 26px / 32px from md up.
 */
export const profileSectionHeadingClass =
  "font-display text-[22px] leading-[28px] font-medium text-heading md:text-[26px] md:leading-[32px]";

/** DM Sans 400. Page subtitle under a profile heading. */
export const pageSubtitleClass =
  "font-sans text-[16px] leading-[24px] font-normal text-meta";

/**
 * DM Sans 500. Conversation-card prompt.
 * 16px on a phone, 18px / 24px from md up.
 */
export const cardSubtitleClass =
  "font-sans text-[16px] leading-[24px] font-medium tracking-[0.01em] text-prompt md:text-[18px]";

/**
 * Fraunces 400. Conversation-card answer.
 * 20px / 30px on a phone, 22px / 32px from md up.
 */
export const cardAnswerClass =
  "mt-3 font-display text-[20px] leading-[30px] font-normal text-copy md:text-[22px] md:leading-[32px]";

/** DM Sans 500. Therapist name, 26px / 32px. */
export const therapistNameClass =
  "font-sans text-[26px] leading-[32px] font-medium text-copy";

/** Same name scale, paper-colored for the photo overlay. */
export const therapistNameOnPhotoClass =
  "font-sans text-[26px] leading-[32px] font-medium text-paper drop-shadow-[0_1px_8px_rgba(23,23,23,0.65)]";

/** DM Sans 400. Credentials, license, location. */
export const metaLineClass =
  "font-sans text-[15px] leading-[22px] font-normal text-meta";

/** DM Sans 400. About and other body copy. */
export const bodyCopyClass =
  "font-sans text-[17px] leading-[28px] font-normal text-copy";

/** DM Sans 500. Small labels such as Areas of interest. */
export const smallLabelClass =
  "font-sans text-[14px] leading-[20px] font-medium tracking-[0.04em] text-meta";

/** One soft tinted pill for profile tags and Find match chips. */
export const softTagClass =
  "inline-flex max-w-full min-w-0 items-center rounded-full bg-pill-bg px-3 py-1 font-sans text-[14px] leading-5 font-medium break-words whitespace-normal text-pill";

/** Back to search and the profile tab toggle. */
export const textActionClass = "font-sans text-[15px] font-medium text-heading";

/** Primary action on Find cards. White on heading purple, 16px / 500. */
export const primaryPillClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-heading font-sans text-[16px] font-medium text-white transition-colors hover:bg-heading/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heading";

/** DM Sans 500. Section labels: 14–16px, deep purple. */
export const sectionLabelClass = "text-sm font-medium leading-snug text-ink sm:text-base";

/** Same as a section label. Sentence case. Not a display face. */
export const eyebrowClass = sectionLabelClass;

/** Sentence-case field label. Deep purple, not body copy. */
export const fieldLabelClass = "text-sm font-medium text-ink";

export const fieldClass =
  "ks-field w-full rounded-full border border-line bg-paper px-4 py-2.5 text-base text-body outline-none placeholder:text-mute/70 focus:border-ink disabled:cursor-not-allowed disabled:opacity-60";

export const selectClass = `${fieldClass} ks-select`;

export const textareaClass =
  "w-full resize-y rounded-box border border-line bg-paper px-4 py-3 text-base leading-6 text-body outline-none placeholder:text-mute/80 focus:border-ink";

/** Homepage paper card: radius, shadow, no extra stroke. */
export const cardClass = "rounded-card bg-paper shadow-card";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full text-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const buttonSizes = {
  md: "px-6 py-2.5 text-sm",
  /** Same height as md. Less side padding so two labels fit a phone dock. */
  sm: "px-3 py-2.5 text-sm",
  /** Profile and Find primary label: 16px. */
  label: "px-6 py-3 text-[16px]",
  /** Phone dock. 16px, tighter padding so two labels fit. */
  dock: "px-3 py-2.5 text-[16px]",
} as const;

const buttonVariants = {
  /** Deep purple fill, white label. */
  primary: "bg-ink text-paper hover:bg-ink-dark",
  /** Profile / Find primary. White on the heading purple. */
  solid: "bg-heading text-white hover:bg-heading/90",
  /** Yellow fill, soft-black label. Newsletter band and the lavender therapist card. */
  gold: "bg-gold text-black hover:bg-gold-dark",
  /** Deep purple text and border on white. */
  secondary: "border border-ink bg-paper text-ink hover:bg-lavender",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClass(
  variant: ButtonVariant = "primary",
  className?: string,
  size: ButtonSize = "md",
) {
  return cx(buttonBase, buttonSizes[size], buttonVariants[variant], className);
}

/** Accent purple text link. */
export const textLinkClass = "text-sm font-medium text-clay hover:text-clay-dark";

export function tagClass(selected: boolean, className?: string) {
  return cx(
    "max-w-full min-w-0 rounded-full px-4 py-2 text-[15px] leading-snug break-words whitespace-normal disabled:cursor-not-allowed disabled:opacity-50 sm:text-[17px]",
    selected
      ? "bg-ink font-medium text-paper hover:bg-ink-dark"
      : "border border-line bg-paper font-normal text-ink hover:border-ink/30",
    className,
  );
}

export function segmentTrackClass({
  stack = false,
  wrap = false,
  size = "md",
  tone = "solid",
}: {
  stack?: boolean;
  wrap?: boolean;
  size?: "md" | "sm";
  tone?: "solid" | "quiet";
} = {}) {
  if (tone === "quiet") {
    return cx(
      "inline-flex max-w-full gap-1",
      stack ? "w-full flex-col sm:w-auto sm:flex-row" : "flex-wrap",
    );
  }
  if (size === "sm") {
    return "inline-flex max-w-full flex-wrap gap-0.5 rounded-full bg-line p-0.5";
  }
  return cx(
    "inline-flex gap-1 bg-line p-1.5",
    stack
      ? "w-full max-w-xl flex-col rounded-[2rem] sm:w-auto sm:flex-row sm:rounded-full"
      : wrap
        ? "flex-wrap rounded-[1.25rem]"
        : "rounded-full",
  );
}

export function segmentOptionClass(
  selected: boolean,
  size: "md" | "sm" = "md",
  tone: "solid" | "quiet" = "solid",
) {
  if (tone === "quiet") {
    const pad = "px-3.5 py-1.5 text-[15px] leading-none";
    return selected
      ? `rounded-full bg-pill-bg text-center font-medium text-heading ${pad}`
      : `rounded-full text-center font-medium text-heading hover:bg-pill-bg/70 ${pad}`;
  }
  const pad = size === "sm" ? "px-3 py-1 text-xs" : "px-5 py-2.5 text-sm";
  return selected
    ? `rounded-full bg-ink text-center font-medium text-paper ${pad}`
    : `rounded-full text-center font-medium text-mute hover:text-ink ${pad}`;
}
