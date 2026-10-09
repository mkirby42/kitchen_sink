import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cx, sectionTitleClass } from "@/components/ui/styles";

/** Homepage card under the site header. Join steps do not use this. */
export function AccountShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <Card className="mx-auto w-full max-w-2xl px-6 py-10 sm:px-12 sm:py-12">
        {eyebrow ? <Eyebrow className="text-center">{eyebrow}</Eyebrow> : null}
        <h1
          className={cx(
            `text-center text-black ${sectionTitleClass}`,
            eyebrow && "mt-4",
          )}
        >
          {title}
        </h1>
        {lede ? (
          <div className="mx-auto mt-3 max-w-md text-center text-base leading-relaxed text-body">
            {lede}
          </div>
        ) : null}
        {children ? (
          <div className="mx-auto mt-8 w-full max-w-md">{children}</div>
        ) : null}
      </Card>
    </main>
  );
}
