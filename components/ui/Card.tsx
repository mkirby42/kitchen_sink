import type { HTMLAttributes } from "react";
import { cardClass, cx } from "./styles";

type CardProps = {
  as?: "section" | "div" | "li" | "article";
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "className">;

export function Card({ as: Tag = "section", className, children, ...props }: CardProps) {
  return (
    <Tag className={cx(cardClass, className)} {...props}>
      {children}
    </Tag>
  );
}
