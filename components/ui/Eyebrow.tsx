import type { ReactNode } from "react";
import { cx, eyebrowClass } from "./styles";

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cx(eyebrowClass, className)}>{children}</p>;
}
