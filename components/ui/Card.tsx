import type { HTMLAttributes } from "react";
import { cardClass, cx } from "./styles";

type CardProps = {
  as?: "section" | "div" | "li" | "article";
  className?: string;
  /** paper: white. lavender: the For Therapists homepage card. */
  tone?: "paper" | "lavender";
} & Omit<HTMLAttributes<HTMLElement>, "className">;

export function Card({
  as: Tag = "section",
  className,
  tone = "paper",
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cx(
        tone === "lavender" ? "rounded-card bg-lavender shadow-card" : cardClass,
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
