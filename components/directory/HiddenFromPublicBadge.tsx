import { ADMIN_ONLY_HIDDEN_LABEL } from "@/lib/therapists/listing";

export function HiddenFromPublicBadge({
  variant,
}: {
  variant: "card" | "banner";
}) {
  if (variant === "banner") {
    return (
      <p
        className="relative z-10 mb-4 rounded-2xl border border-ink/30 bg-paper px-4 py-3 text-sm font-medium text-ink"
        role="status"
      >
        {ADMIN_ONLY_HIDDEN_LABEL}
      </p>
    );
  }

  return (
    <p
      className="mt-2 inline-flex rounded-full border border-ink/30 bg-cream px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-ink"
      role="status"
    >
      {ADMIN_ONLY_HIDDEN_LABEL}
    </p>
  );
}
