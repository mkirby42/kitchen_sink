"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { cx, segmentOptionClass, segmentTrackClass } from "./styles";

type SegmentTone = "solid" | "quiet";

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  stack = false,
  wrap = false,
  size = "md",
  fill = false,
  disabled = false,
  tone = "solid",
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string; href?: string }[];
  onChange: (value: T) => void;
  className?: string;
  /** Homepage: column on a phone, pill row from sm up. */
  stack?: boolean;
  wrap?: boolean;
  /** sm is the header view switcher. md is the homepage switch. */
  size?: "md" | "sm";
  /** Stretch the track and split the options evenly. */
  fill?: boolean;
  disabled?: boolean;
  /** quiet is the profile Profile/Reviews toggle: 15px heading purple. */
  tone?: SegmentTone;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(
        segmentTrackClass({ stack, wrap, size, tone }),
        fill && "flex w-full",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const className = cx(
          segmentOptionClass(selected, size, tone),
          stack &&
            size === "md" &&
            "flex w-full items-center justify-center sm:inline-flex sm:w-auto",
          fill && "min-w-0 flex-1",
        );
        if (option.href) {
          return (
            <Link
              key={option.value}
              href={option.href}
              aria-current={selected ? "page" : undefined}
              onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                if (
                  event.metaKey ||
                  event.altKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.button !== 0
                ) {
                  return;
                }
                event.preventDefault();
                onChange(option.value);
              }}
              className={className}
            >
              {option.label}
            </Link>
          );
        }
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={className}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
