"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { tagClass, textLinkClass, therapistNameClass } from "@/components/ui/styles";
import { referralHeadline } from "@/lib/referrals/options";
import { referralError, type MinePost } from "@/lib/referrals/rows";
import {
  canCloseEarly,
  canRefresh,
  canReviewInterest,
  closesLabel,
  interestCountLabel,
  postedAgo,
  referralNow,
  referralPhase,
} from "@/lib/referrals/time";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { ReferralShell } from "./ReferralBits";

export function MyReferrals({
  posts,
  notice,
  loadError,
}: {
  posts: MinePost[];
  notice: string | null;
  loadError: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(loadError ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);
  const now = referralNow();

  async function run(post: MinePost, action: "close" | "refresh") {
    setMessage("");
    setBusyId(post.id);
    try {
      const supabase = createClient();
      const { error } =
        action === "close"
          ? await supabase.rpc("close_referral_post", { p_id: post.id })
          : await supabase.rpc("refresh_referral_post", { p_token: post.refreshToken });
      if (error) {
        setMessage(referralError(error));
        return;
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn't update that referral.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ReferralShell
      eyebrow="My referrals"
      title="My referrals"
      lede="Posts wait for approval, stay on the board for a week, and can be refreshed after they close."
      action={
        <Button href={routes.referralNew} variant="solid" size="sm">
          + Refer
        </Button>
      }
    >
      <div className="mb-4">
        <Link href={routes.referrals} className={textLinkClass}>
          Referral board
        </Link>
      </div>
      {notice ? (
        <div className="mb-4">
          <Notice>{notice}</Notice>
        </div>
      ) : null}
      {message ? (
        <div className="mb-4">
          <Notice role="alert">{message}</Notice>
        </div>
      ) : null}
      {posts.length === 0 ? (
        <Card className="px-4 py-4">
          <p className="text-sm text-mute">{"You haven't posted a referral yet."}</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => {
            const phase = referralPhase(post, now);
            const busy = busyId === post.id;
            return (
              <Card as="li" key={post.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-meta">{postedAgo(post.createdAt, now)}</p>
                  <span className={tagClass(phase === "Live" || phase === "Pending")}>
                    {phase}
                  </span>
                </div>
                <h2 className={`mt-2 ${therapistNameClass}`}>{referralHeadline(post)}</h2>
                <p className="mt-2 text-sm text-mute">
                  {phase === "Pending"
                    ? "Waiting for Kitchen Sink to approve it."
                    : phase === "Live"
                      ? `${interestCountLabel(post.interestCount)} · ${closesLabel(post.closesAt, now)}`
                      : phase === "Expired"
                        ? "This post is off the board. Refresh it to open another week."
                        : phase === "Closed"
                          ? "You closed this post. Refresh puts the same request back up for a week."
                          : phase === "Rejected"
                            ? "Kitchen Sink did not approve this post."
                            : "Kitchen Sink removed this post."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {canReviewInterest(phase) ? (
                    <Button href={routes.referralPost(post.id)} size="sm">
                      {"Who's interested"}
                    </Button>
                  ) : null}
                  {canCloseEarly(phase) ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busyId !== null}
                      onClick={() => void run(post, "close")}
                    >
                      {busy ? "Please wait…" : "Close"}
                    </Button>
                  ) : null}
                  {canRefresh(phase) ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId !== null}
                      onClick={() => void run(post, "refresh")}
                    >
                      {busy ? "Please wait…" : "Refresh"}
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </ReferralShell>
  );
}
