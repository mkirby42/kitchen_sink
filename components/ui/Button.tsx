import Link from "next/link";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./styles";

export function Button({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  type = "button",
  ...props
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  href?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  const classes = buttonClass(variant, className, size);

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={props["aria-label"]}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
