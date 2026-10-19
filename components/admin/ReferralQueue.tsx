"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Notice } from "@/components/ui/Notice";
import { sectionTitleClass, softTagClass, tagClass, textLinkClass } from "@/components/ui/styles";
import { referralError, type QueuePost } from "@/lib/referrals/rows";
import { referralHeadline } from "@/lib/referrals/options";
import {
  closesLabel,
  interestCountLabel,
  postedAgo,
  referralNow,
  referralPhase,
} from "@/lib/referrals/time";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

export function ReferralQueue({ posts }: { posts: QueuePost[] }) {
  const router = useRouter();
  const [hidden, setHidden] = useState<string[]>([]);
  const [approved, setApproved] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const now = referralNow();
  const rows = posts
    .filter((post) => !hidden.includes(post.id))
    .map((post) =>
      approved.includes(post.id) && post.status === "pending"
        ? {
            ...post,
            status: "approved",
            closesAt: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : post,
    );
  const pending = rows.filter((post) => post.status === "pending");
  const live = rows.filter((post) => referralPhase(post, now) === "Live");
  const rest = rows.filter(
    (post) => post.status !== "pending" && referralPhase(post, now) !== "Live",
  );

  async function run(id: string, action: "approve" | "reject" | "remove") {
    setMessage("");
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("moderate_referral", {
        p_id: id,
        p_action: action,
      });
      if (error) {
        setMessage(referralError(error));
        return;
      }
      if (action === "approve") setApproved((current) => [...current, id]);
      else setHidden((current) => [...current, id]);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn't update that referral.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Eyebrow>Ops</Eyebrow>
      <h1 className={`mt-1 text-ink ${sectionTitleClass}`}>Referral queue</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">
        Approve a post to put it on the board for one week. Reject a post that
        is not general enough. Remove takes a live post off the board.
      </p>
      {message ? (
        <div className="mt-4">
          <Notice role="alert">{message}</Notice>
        </div>
      ) : null}
      <Section title="Waiting for approval" posts={pending} now={now} busyId={busyId} onRun={run} />
      <Section title="On the board" posts={live} now={now} busyId={busyId} onRun={run} />
      <Section title="Closed" posts={rest} now={now} busyId={busyId} onRun={run} />
    </main>
  );
}

function Section({
  title,
  posts,
  now,
  busyId,
  onRun,
}: {
  title: string;
  posts: QueuePost[];
  now: number;
  busyId: string | null;
  onRun: (id: string, action: "approve" | "reject" | "remove") => void;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-ink">{title}</h2>
      {posts.length === 0 ? (
        <Card className="mt-3 px-4 py-3">
          <p className="text-sm text-mute">Nothing here.</p>
        </Card>
      ) : (
        <ul className="mt-3 space-y-3">
          {posts.map((post) => {
            const phase = referralPhase(post, now);
            const busy = busyId === post.id;
            return (
              <Card as="li" key={post.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-black">
                      <Link href={routes.therapist(post.posterId)} className={textLinkClass}>
                        {post.posterName}
                      </Link>
                    </p>
                    <p className="mt-1 text-sm text-mute">
                      {postedAgo(post.createdAt, now)}
                      {post.closesAt ? ` · ${closesLabel(post.closesAt, now)}` : ""}
                      {` · ${interestCountLabel(post.interestCount)}`}
                    </p>
                  </div>
                  <span className={tagClass(phase === "Pending" || phase === "Live")}>{phase}</span>
                </div>
                <p className="mt-3 font-medium text-copy">{referralHeadline(post)}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {[...post.focusAreas, ...post.payments, post.area]
                    .filter((label): label is string => Boolean(label))
                    .map((label) => (
                      <li key={label} className={softTagClass}>
                        {label}
                      </li>
                    ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.status === "pending" ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyId !== null}
                        onClick={() => onRun(post.id, "approve")}
                      >
                        {busy ? "Please wait…" : "Approve"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={busyId !== null}
                        onClick={() => onRun(post.id, "reject")}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busyId !== null}
                      onClick={() => onRun(post.id, "remove")}
                    >
                      {busy ? "Please wait…" : "Remove"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </section>
  );
}
