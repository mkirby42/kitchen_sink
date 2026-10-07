"use client";

import type { ReactNode } from "react";
import { tagClass } from "./styles";

export function Tag({
  selected,
  onClick,
  disabled = false,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={tagClass(selected)}
    >
      {children}
    </button>
  );
}
