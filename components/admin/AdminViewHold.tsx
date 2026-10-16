import { AccountShell } from "@/components/auth/AccountShell";

export function AdminViewHold() {
  return (
    <AccountShell
      eyebrow="Ops"
      title="Admin view"
      lede="Drafts, uploads, the review queue, and analytics are part of Admin view. Switch back in the header to use them. Your admin access is unchanged."
    />
  );
}
