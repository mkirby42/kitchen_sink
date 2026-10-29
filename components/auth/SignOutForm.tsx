import { authPost } from "@/lib/auth/auth-query";

/** Native POST. Works when the page never hydrates. */
export function SignOutForm({
  className = "text-sm font-normal text-ink/75 hover:text-ink",
}: {
  className?: string;
}) {
  return (
    <form method="post" action={authPost.signOut} className="shrink-0">
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  );
}
