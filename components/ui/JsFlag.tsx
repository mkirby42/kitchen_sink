"use client";

import { useLayoutEffect } from "react";

/** Re-apply after hydration. React resets the class the inline script set. */
export function JsFlag() {
  useLayoutEffect(() => {
    document.documentElement.classList.add("js");
  }, []);
  return null;
}
