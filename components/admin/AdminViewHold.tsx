import { AccountShell } from "@/components/auth/AccountShell";

export function AdminViewHold() {
  return (
    <AccountShell
      eyebrow="Ops"
      title="Admin view"
      lede="Uploads and the review queue are part of Admin view. Switch back in the header to use them. Your admin access is unchanged."
    />
  );
}
