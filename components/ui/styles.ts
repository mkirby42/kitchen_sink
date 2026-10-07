export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Serif clay line. Sentence case. Replaces tiny all-caps kickers. */
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
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-center text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants = {
  primary: "bg-clay text-paper hover:bg-clay-dark",
  secondary: "border border-ink/15 bg-paper text-ink hover:border-ink/30",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cx(buttonBase, buttonVariants[variant], className);
}

export function tagClass(selected: boolean, className?: string) {
  return cx(
    "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50",
    selected
      ? "bg-clay text-paper hover:bg-clay-dark"
      : "border border-line bg-paper text-ink hover:border-ink/20",
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
    : `rounded-full text-center font-medium text-ink/65 hover:text-ink ${pad}`;
}
