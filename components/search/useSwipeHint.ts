"use client";

import { useCallback, useSyncExternalStore } from "react";

const HINT_KEY = "ks-phone-swipe-hint";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function dismissed() {
  try {
    return sessionStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

/** One hint per browser session, shared by Find and the profile pager. */
export function useSwipeHint(enabled: boolean) {
  const seen = useSyncExternalStore(subscribe, dismissed, () => false);
  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(HINT_KEY, "1");
    } catch {
      /* private mode */
    }
    emit();
  }, []);
  return { show: enabled && !seen, dismiss };
}
