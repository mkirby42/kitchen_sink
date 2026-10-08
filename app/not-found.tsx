import type { Metadata } from "next";
import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: { absolute: "404: This page could not be found." },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <AccountShell eyebrow="404" title="This page could not be found.">
      <div className="flex justify-center">
        <Button href={routes.home}>Home</Button>
      </div>
    </AccountShell>
  );
}
