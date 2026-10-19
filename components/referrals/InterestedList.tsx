"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { buttonClass, metaLineClass, textLinkClass } from "@/components/ui/styles";
import {
  buildClientReferralMailto,
  credentialLine,
  profileIsPublic,
  therapistFitLine,
  type SharePost,
  type ShareTherapist,
} from "@/lib/referrals/email";
import { referralError } from "@/lib/referrals/rows";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { Initials, ReferralShell } from "./ReferralBits";

export function InterestedList({
  postId,
  post,
  therapists,
  origin,
  canClose,
}: {
  postId: string;
  post: SharePost;
  therapists: ShareTherapist[];
  origin: string;
  canClose: boolean;
}) {
  const router = useRouter();
  const publicIds = therapists.filter(profileIsPublic).map((therapist) => therapist.id);
  const [selected, setSelected] = useState<string[]>(publicIds);
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [busy, setBusy] = useState<"close" | "share" | null>(null);
  const chosen = therapists.filter(
    (therapist) => selected.includes(therapist.id) && profileIsPublic(therapist),
  );
  const mailto = chosen.length
    ? buildClientReferralMailto({ origin, post, therapists: chosen })
    : null;
  const title =
    therapists.length === 0
      ? "No one is interested yet"
      : therapists.length === 1
        ? "1 therapist is interested"
        : `${therapists.length} therapists are interested`;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function copyShare() {
    setMessage("");
    setBusy("share");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_referral_share", {
        p_post_id: postId,
        p_therapist_ids: chosen.map((therapist) => therapist.id),
      });
      if (error || typeof data !== "string") {
        setMessage(error ? referralError(error) : "Couldn't update that referral.");
        return;
      }
      const url = `${origin}${routes.referralShare(data)}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setMessage("Share link copied.");
      } catch {
        setMessage("Copy the link below.");
      }
    } finally {
      setBusy(null);
    }
  }

  async function closePost() {
    setMessage("");
    setBusy("close");
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("close_referral_post", { p_id: postId });
      if (error) {
        setMessage(referralError(error));
        return;
      }
      router.push(routes.referralMine);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <ReferralShell
      eyebrow="Your referral"
      title={title}
      lede="Tick who to include. The email opens in your own mail app. Kitchen Sink never receives your client's name or contact info."
      action={
        <Link href={routes.referralMine} className={textLinkClass}>
          My referrals
        </Link>
      }
    >
      {therapists.length === 0 ? (
        <Card className="px-4 py-4">
          <p className="text-sm text-mute">
            No therapists have tapped interested yet.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {therapists.map((therapist) => {
            const isPublic = profileIsPublic(therapist);
            const checked = selected.includes(therapist.id);
            return (
              <Card as="li" key={therapist.id} className="px-4 py-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-3 accent-ink"
                    checked={isPublic && checked}
                    disabled={!isPublic}
                    onChange={() => toggle(therapist.id)}
                  />
                  <Initials name={therapist.name} />
                  <span className="min-w-0">
                    <span className="block font-medium text-copy">
                      {credentialLine(therapist.name, therapist.credential)}
                    </span>
                    <span className={`mt-1 block ${metaLineClass}`}>
                      {therapistFitLine(post, therapist) || "Published profile"}
                    </span>
                    {isPublic ? null : (
                      <span className="mt-1 block text-sm text-mute">
                        This profile is hidden, so the link will not open for your client.
                      </span>
                    )}
                  </span>
                </label>
              </Card>
            );
          })}
        </ul>
      )}

      {mailto ? (
        <Card className="mt-4 px-4 py-4">
          <p className="text-sm font-medium text-ink">Message preview</p>
          <p className="mt-2 text-sm text-mute">To: your client&apos;s email</p>
          <p className="mt-1 text-sm text-body">Subject: {mailto.subject}</p>
          <pre className="mt-3 font-sans text-sm leading-relaxed whitespace-pre-wrap text-body">
            {mailto.body}
          </pre>
        </Card>
      ) : null}

      {message ? (
        <div className="mt-4">
          <Notice role={message === "Share link copied." ? "status" : "alert"}>{message}</Notice>
        </div>
      ) : null}
      {shareUrl ? (
        <p className="mt-3 break-all text-sm text-clay">
          <a href={shareUrl}>{shareUrl}</a>
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {mailto ? (
          <a className={buttonClass("solid", "w-full", "label")} href={mailto.href}>
            Email these {chosen.length} to my client →
          </a>
        ) : (
          <Button type="button" variant="solid" size="label" className="w-full" disabled>
            Email these to my client →
          </Button>
        )}
        <button
          type="button"
          className="block w-full text-center text-sm font-medium text-clay hover:text-clay-dark"
          disabled={chosen.length === 0 || busy !== null}
          onClick={() => void copyShare()}
        >
          {busy === "share" ? "Please wait…" : "Copy share link instead"}
        </button>
        {canClose ? (
          <Button
            type="button"
            variant="secondary"
            size="label"
            className="w-full"
            disabled={busy !== null}
            onClick={() => void closePost()}
          >
            {busy === "close" ? "Please wait…" : "Close this request"}
          </Button>
        ) : null}
      </div>
    </ReferralShell>
  );
}
