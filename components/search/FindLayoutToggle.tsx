import Link from "next/link";
import { buildFindHref } from "@/components/search/query";
import type { SearchFilters } from "@/lib/search/rpc";

export function FindLayoutToggle({
  filters,
  layout,
}: {
  filters: SearchFilters;
  layout: "grid" | "one";
}) {
  const gridHref = buildFindHref(filters, { layout: "grid" });
  const oneHref = buildFindHref(filters, { layout: "one" });

  return (
    <div
      role="group"
      aria-label="Result layout"
      className="inline-flex shrink-0 rounded-full bg-paper p-1 shadow-card"
    >
      <LayoutChoice href={gridHref} current={layout === "grid"}>
        Grid
      </LayoutChoice>
      <LayoutChoice href={oneHref} current={layout === "one"}>
        One at a time
      </LayoutChoice>
    </div>
  );
}

function LayoutChoice({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={current ? "page" : undefined}
      className={
        current
          ? "rounded-full bg-heading px-3.5 py-1.5 font-sans text-[14px] font-medium text-white"
          : "rounded-full px-3.5 py-1.5 font-sans text-[14px] font-medium text-ink"
      }
    >
      {children}
    </Link>
  );
}
