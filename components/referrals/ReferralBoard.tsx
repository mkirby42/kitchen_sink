"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { Tag } from "@/components/ui/Tag";
import { therapistNameClass, textLinkClass } from "@/components/ui/styles";
import { filterBoardPosts, referralPills, type BoardFilter, type ReferralViewer } from "@/lib/referrals/match";
import { PAYMENT_OPTIONS, referralHeadline } from "@/lib/referrals/options";
import { boardHref, referralError, type BoardPost } from "@/lib/referrals/rows";
import { closesLabel, interestCountLabel, postedAgo } from "@/lib/referrals/time";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { Check, ReferralPills, ReferralShell } from "./ReferralBits";
import { ReferralHowItWorks } from "./ReferralHowItWorks";

export function ReferralBoard({
  posts,
  viewer,
  filter,
  loadError,
  now,
}: {
  posts: BoardPost[];
  viewer: ReferralViewer;
  filter: BoardFilter;
  loadError: string | null;
  now: number;
}) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<
    Record<string, { viewerInterested: boolean; interestCount: number }>
  >({});
  const rows = posts.map((post) => {
    const override = overrides[post.id];
    if (!override || override.viewerInterested === post.viewerInterested) return post;
    return { ...post, ...override };
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState(loadError ?? "");
  const visible = filterBoardPosts(rows, viewer, filter);

  async function toggle(post: BoardPost) {
    if (post.viewerIsPoster) return;
    const next = !post.viewerInterested;
    setMessage("");
    setBusyId(post.id);
    setOverrides((current) => ({
      ...current,
      [post.id]: {
        viewerInterested: next,
        interestCount: Math.max(0, post.interestCount + (next ? 1 : -1)),
      },
    }));
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("set_referral_interest", {
        p_post_id: post.id,
        p_interested: next,
      });
      if (error) {
        setOverrides((current) => {
          const nextOverrides = { ...current };
          delete nextOverrides[post.id];
          return nextOverrides;
        });
        setMessage(referralError(error));
        return;
      }
      router.refresh();
    } catch (error) {
      setOverrides((current) => {
        const nextOverrides = { ...current };
        delete nextOverrides[post.id];
        return nextOverrides;
      });
      setMessage(error instanceof Error ? error.message : "Couldn't update that referral.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ReferralShell
      eyebrow="Referral board"
      title="Referral board"
      lede="For therapists with a published profile. Kitchen Sink approves each post. A post stays up for one week."
      action={
        <Button href={routes.referralNew} variant="solid" size="sm">
          + Refer
        </Button>
      }
    >
      <ReferralHowItWorks />
      <div className="mb-4 flex justify-end">
        <Link href={routes.referralMine} className={textLinkClass}>
          My referrals
        </Link>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter requests">
        <Tag
          selected={filter.kind === "matches"}
          onClick={() => router.push(boardHref({ kind: "matches" }))}
        >
          Matches me
        </Tag>
        <Tag
          selected={filter.kind === "all"}
          onClick={() => router.push(boardHref({ kind: "all" }))}
        >
          All requests
        </Tag>
        {PAYMENT_OPTIONS.map((payment) => (
          <Tag
            key={payment}
            selected={filter.kind === "payment" && filter.payment === payment}
            onClick={() => router.push(boardHref({ kind: "payment", payment }))}
          >
            {payment}
          </Tag>
        ))}
      </div>
      {message ? (
        <div className="mt-4">
          <Notice role="alert">{message}</Notice>
        </div>
      ) : null}
      {visible.length === 0 ? (
        <Card className="mt-4 px-4 py-4">
          <p className="text-sm text-mute">
            {rows.length === 0
              ? "No open requests right now."
              : "Nothing in this filter."}
          </p>
        </Card>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((post) => (
            <Card as="li" key={post.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3 text-sm text-meta">
                <span>{postedAgo(post.createdAt, now)}</span>
                <span>{closesLabel(post.closesAt, now)}</span>
              </div>
              <h2 className={`mt-2 ${therapistNameClass}`}>
                {referralHeadline(post)}
              </h2>
              <ReferralPills pills={referralPills(post, viewer)} />
              <p className="mt-3 text-sm text-mute">
                {interestCountLabel(post.interestCount)}
              </p>
              {post.viewerIsPoster ? (
                <Button
                  href={routes.referralPost(post.id)}
                  variant="secondary"
                  size="label"
                  className="mt-3 w-full"
                >
                  {"Who's interested"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant={post.viewerInterested ? "secondary" : "solid"}
                  size="label"
                  className="mt-3 w-full"
                  disabled={busyId !== null}
                  onClick={() => void toggle(post)}
                >
                  {post.viewerInterested ? (
                    <>
                      <Check /> {"You're interested"}
                    </>
                  ) : (
                    "I'm interested"
                  )}
                </Button>
              )}
            </Card>
          ))}
        </ul>
      )}
    </ReferralShell>
  );
}
