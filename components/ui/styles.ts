export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Caprasimo violet line. Sentence case. Replaces tiny all-caps kickers. */
export const eyebrowClass = "font-display text-lg leading-snug text-clay";

/** Sentence-case field label. Not tracking-wide capitals. */
export const fieldLabelClass = "text-sm font-medium text-ink";

export const fieldClass =
  "ks-field w-full rounded-full border border-line bg-paper px-4 py-2.5 text-base text-ink outline-none placeholder:text-mute/70 focus:border-clay disabled:cursor-not-allowed disabled:opacity-60";

export const selectClass = `${fieldClass} ks-select`;

export const textareaClass =
  "w-full resize-y rounded-box border border-line bg-paper px-4 py-3 text-base leading-6 text-ink outline-none placeholder:text-mute/80 focus:border-clay";

/** Homepage paper card: radius, shadow, no extra stroke. */
export const cardClass = "rounded-card bg-paper shadow-card";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full text-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const buttonSizes = {
  md: "px-6 py-2.5 text-sm",
  /** Same height as md. Less side padding so two labels fit a phone dock. */
  sm: "px-3 py-2.5 text-sm",
} as const;

const buttonVariants = {
  /** Eggplant fill. Light surfaces, including the find CTA. */
  primary: "bg-ink text-paper hover:bg-ink-dark",
  /** Mustard fill, eggplant label. Newsletter band and the lavender therapist card. */
  gold: "bg-gold text-ink hover:bg-gold-dark",
  /** Eggplant outline on white. */
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

/** Violet text link. Same weight as the pill buttons. */
export const textLinkClass = "text-sm font-medium text-clay hover:text-clay-dark";

export function tagClass(selected: boolean, className?: string) {
  return cx(
    "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50",
    selected
      ? "bg-ink text-paper hover:bg-ink-dark"
      : "border border-line bg-paper text-ink hover:border-ink/30",
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
    ? `rounded-full bg-ink text-center font-medium text-paper ${pad}`
    : `rounded-full text-center font-medium text-ink/80 hover:text-ink ${pad}`;
}
