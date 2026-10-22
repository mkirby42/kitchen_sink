"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { browseStep, clampIndex } from "@/lib/search/phone-browse";

function stepSize(el: HTMLElement | null) {
  if (!el) return 0;
  const slide = el.firstElementChild;
  if (!(slide instanceof HTMLElement)) return el.clientWidth;
  const styles = getComputedStyle(el);
  const gap = Number.parseFloat(styles.columnGap || "0");
  const width = slide.getBoundingClientRect().width;
  if (width <= 0) return el.clientWidth;
  return width + (Number.isFinite(gap) ? gap : 0);
}

/** Horizontal snap scroller. The page still scrolls vertically. */
export function useHorizontalSnap(
  count: number,
  scrollerRef: RefObject<HTMLDivElement | null>,
  slideRefs: RefObject<Array<HTMLDivElement | null>>,
) {
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
      const width = stepSize(el);
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
      const width = stepSize(el);
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
  }, [count, scrollerRef]);

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
  }, [index, count, scrollerRef, slideRefs]);

  function goTo(next: number) {
    const target = clampIndex(next, count);
    if (target === indexRef.current) return;
    pendingRef.current = target;
    indexRef.current = target;
    setIndex(target);
    const el = scrollerRef.current;
    const width = stepSize(el);
    if (!el || width <= 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({
      left: target * width,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  function release() {
    pendingRef.current = null;
  }

  function onBrowseKey(key: "ArrowLeft" | "ArrowRight") {
    goTo(browseStep(indexRef.current, count, key === "ArrowLeft" ? -1 : 1));
  }

  return { index, goTo, release, onBrowseKey };
}
