"use client";

import { SegmentedControl as UiSegmentedControl } from "@/components/ui/SegmentedControl";

/** Header-sized navy switch. Same component as the homepage control. */
export function SegmentedControl<T extends string>(props: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return <UiSegmentedControl size="sm" {...props} />;
}
