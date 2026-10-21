"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { carouselStatus } from "@/lib/search/find-desktop";

export type FindSlide = {
  id: string;
  card: ReactNode;
};

export function FindCarousel({ slides }: { slides: FindSlide[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const ids = slides.map((slide) => slide.id).join("\n");
  const [seenIds, setSeenIds] = useState(ids);
  if (ids !== seenIds) {
    setSeenIds(ids);
    setIndex(0);
  }

  const scrollToIndex = useCallback((next: number, behavior: ScrollBehavior) => {
    const root = scroller.current;
    const clamped = Math.max(0, Math.min(count - 1, next));
    setIndex(clamped);
    const slide = root?.children[clamped] as HTMLElement | undefined;
    if (!root || !slide || root.clientWidth === 0) return;
    root.scrollTo({
      left: slide.offsetLeft - (root.clientWidth - slide.offsetWidth) / 2,
      behavior,
    });
  }, [count]);

  useEffect(() => {
    const root = scroller.current;
    const slide = root?.children[0] as HTMLElement | undefined;
    if (!root || !slide || root.clientWidth === 0) return;
    root.scrollLeft =
      slide.offsetLeft - (root.clientWidth - slide.offsetWidth) / 2;
  }, [ids]);

  function onScroll() {
    const root = scroller.current;
    if (!root || root.clientWidth === 0) return;
    const mid = root.scrollLeft + root.clientWidth / 2;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    Array.from(root.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
      if (dist < bestDist) {
        best = i;
        bestDist = dist;
      }
    });
    setIndex(best);
  }

  if (count === 0) return null;
  const status = carouselStatus(index, count);

  return (
    <section aria-roledescription="carousel" aria-label="Matching therapists">
      <p aria-live="polite" className="mb-4 font-sans text-[15px] leading-6 text-meta">
        {status}
      </p>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-[8%] px-[8%] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="w-[84%] shrink-0 snap-center"
            inert={i === index ? undefined : true}
          >
            {slide.card}
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous therapist"
          disabled={index === 0}
          onClick={() => scrollToIndex(index - 1, "smooth")}
          className="flex size-11 items-center justify-center rounded-full border border-line bg-paper text-ink disabled:opacity-40"
        >
          <Arrow direction="left" />
        </button>
        <div className="flex items-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Therapist ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => scrollToIndex(i, "smooth")}
              className={
                i === index
                  ? "h-2 w-6 rounded-full bg-heading"
                  : "size-2 rounded-full bg-heading/30"
              }
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next therapist"
          disabled={index >= count - 1}
          onClick={() => scrollToIndex(index + 1, "smooth")}
          className="flex size-11 items-center justify-center rounded-full bg-heading text-white disabled:opacity-40"
        >
          <Arrow direction="right" />
        </button>
      </div>
    </section>
  );
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
      <path
        d={direction === "left" ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
