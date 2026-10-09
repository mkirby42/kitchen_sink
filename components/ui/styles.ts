export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** DM Serif Display, regular. Homepage and other page headlines: 36–44px, soft black. */
export const pageTitleClass =
  "font-display text-[2.25rem] leading-[1.15] font-normal tracking-tight text-black sm:text-[2.75rem]";

/** DM Serif Display, regular. Section headlines: 28–34px. Color is applied at the call site. */
export const sectionTitleClass =
  "font-display text-[1.75rem] leading-snug font-normal tracking-tight sm:text-[2.125rem]";

/** DM Sans 700. Therapist names: 28–32px, soft black. */
export const therapistNameClass =
  "font-sans text-[1.75rem] leading-none font-bold tracking-tight text-black lg:text-[2rem]";

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
  "inline-flex items-center justify-center gap-2 rounded-full text-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const buttonSizes = {
  md: "px-6 py-2.5 text-sm",
  /** Same height as md. Less side padding so two labels fit a phone dock. */
  sm: "px-3 py-2.5 text-sm",
} as const;

const buttonVariants = {
  /** Deep purple fill, white label. */
  primary: "bg-ink text-paper hover:bg-ink-dark",
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
}: {
  stack?: boolean;
  wrap?: boolean;
  size?: "md" | "sm";
} = {}) {
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

export function segmentOptionClass(selected: boolean, size: "md" | "sm" = "md") {
  const pad = size === "sm" ? "px-3 py-1 text-xs" : "px-5 py-2.5 text-sm";
  return selected
    ? `rounded-full bg-ink text-center font-semibold text-paper ${pad}`
    : `rounded-full text-center font-medium text-mute hover:text-ink ${pad}`;
}
