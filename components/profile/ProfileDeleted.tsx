import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

export function ProfileDeleted() {
  return (
    <AccountShell
      eyebrow="Profile deleted"
      title="Your therapist profile is gone."
      lede="It no longer appears in Find or on a public therapist page. Your login is still active, so you can publish a new profile whenever you want."
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button href={routes.home}>Home</Button>
        <Button href={routes.join} variant="secondary">
          Join again
        </Button>
      </div>
    </AccountShell>
  );
}
