import Link from "next/link";
import { buttonClass, type ButtonVariant } from "./styles";

export function Button({
  variant = "primary",
  className,
  href,
  children,
  type = "button",
  ...props
}: {
  variant?: ButtonVariant;
  className?: string;
  href?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  const classes = buttonClass(variant, className);

  if (href) {
    return (
      <Link href={href} className={classes}>
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
