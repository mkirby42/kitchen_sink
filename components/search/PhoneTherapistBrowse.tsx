"use client";

import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  browseStep,
  clampIndex,
  phoneBrowseRootClass,
  phoneScrollerClass,
  phoneSlideClass,
} from "@/lib/search/phone-browse";

function Chevron({ direction }: { direction: "left" | "right" }) {
  const d =
    direction === "left" ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5";
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const controlClass =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-ink bg-paper text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40";

export function PhoneTherapistBrowse({
  ids,
  names,
  browseKey,
  children,
}: {
  ids: string[];
  names: string[];
  browseKey: string;
  children: ReactNode;
}) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const indexRef = useRef(0);
  const pendingRef = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const publish = (next: number) => {
      const clamped = clampIndex(next, count);
      if (clamped === indexRef.current) return;
      indexRef.current = clamped;
      setIndex(clamped);
    };

    const onScroll = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      const measured = clampIndex(Math.round(el.scrollLeft / width), count);
      if (pendingRef.current !== null) {
        if (Math.abs(el.scrollLeft - pendingRef.current * width) <= 2) {
          pendingRef.current = null;
        }
        return;
      }
      publish(measured);
    };

    const snapToIndex = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      const left = indexRef.current * width;
      if (Math.abs(el.scrollLeft - left) <= 1) return;
      el.scrollTo({ left, behavior: "auto" });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(snapToIndex);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [count]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const slide = slideRefs.current[index];
    if (!scroller || !slide) return;
    const fit = () => {
      scroller.style.height = `${slide.offsetHeight}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(slide);
    return () => observer.disconnect();
  }, [index, count]);

  function goTo(next: number) {
    const target = clampIndex(next, count);
    if (target === indexRef.current) return;
    pendingRef.current = target;
    indexRef.current = target;
    setIndex(target);
    const el = scrollerRef.current;
    if (!el || el.clientWidth <= 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({
      left: target * el.clientWidth,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest("[data-browse-control]")) return;
    event.preventDefault();
    goTo(browseStep(indexRef.current, count, event.key === "ArrowLeft" ? -1 : 1));
  }

  const activeName = names[index];

  return (
    <div
      data-phone-browse=""
      data-browse-key={browseKey}
      className={phoneBrowseRootClass}
      role="region"
      aria-roledescription="carousel"
      aria-label="Therapists"
      onKeyDown={onKeyDown}
    >
      {count > 1 ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            data-browse-control="prev"
            className={controlClass}
            aria-label="Previous therapist"
            disabled={index === 0}
            onClick={() => goTo(browseStep(index, count, -1))}
          >
            <Chevron direction="left" />
          </button>
          <div className="min-w-0 text-center">
            <p
              className="font-sans text-sm whitespace-nowrap text-mute"
              aria-live="polite"
              aria-atomic="true"
            >
              {activeName ? <span className="sr-only">{activeName}. </span> : null}
              {index + 1} of {count}
            </p>
            <div aria-hidden className="mt-1.5 flex flex-wrap justify-center gap-1.5">
              {names.map((name, dot) => (
                <span
                  key={ids[dot] ?? `${name}-${dot}`}
                  className={
                    dot === index
                      ? "size-2 rounded-full bg-heading"
                      : "size-2 rounded-full bg-heading/30"
                  }
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            data-browse-control="next"
            className={controlClass}
            aria-label="Next therapist"
            disabled={index >= count - 1}
            onClick={() => goTo(browseStep(index, count, 1))}
          >
            <Chevron direction="right" />
          </button>
        </div>
      ) : null}
      <div
        ref={scrollerRef}
        id="phone-therapist-browse"
        data-phone-scroller=""
        className={phoneScrollerClass}
        onPointerDown={() => {
          pendingRef.current = null;
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        {slides.map((slide, position) => (
          <div
            key={ids[position] ?? position}
            ref={(node) => {
              slideRefs.current[position] = node;
            }}
            data-phone-slide={position === index ? "active" : "inactive"}
            className={phoneSlideClass}
            aria-hidden={position === index ? undefined : true}
            inert={position === index ? undefined : true}
          >
            {slide}
          </div>
        ))}
      </div>
    </div>
  );
}
