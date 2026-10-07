"use client";

import { cx, segmentOptionClass, segmentTrackClass } from "./styles";

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  stack = false,
  wrap = false,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
  /** Homepage: column on a phone, pill row from sm up. */
  stack?: boolean;
  wrap?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(segmentTrackClass({ stack, wrap }), className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              segmentOptionClass(selected),
              stack &&
                "flex w-full items-center justify-center sm:inline-flex sm:w-auto",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
