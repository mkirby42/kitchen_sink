import type { ReactNode } from "react";

/** Short status or error line inside a paper card. */
export function Notice({
  children,
  role = "status",
}: {
  children: ReactNode;
  role?: "alert" | "status";
}) {
  return (
    <p
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
      className="rounded-box bg-cream px-4 py-3 text-left text-sm leading-relaxed text-clay-dark"
    >
      {children}
    </p>
  );
}
