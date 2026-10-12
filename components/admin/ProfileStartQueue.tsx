"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Notice } from "@/components/ui/Notice";
import { sectionTitleClass, tagClass, textLinkClass } from "@/components/ui/styles";
import {
  beginProfileDraft,
  sendDraftReadyEmail,
} from "@/lib/profile-start/actions";
import { joinPath, routes } from "@/lib/routes";

export type ProfileStartItem = {
  id: string;
  name: string;
  email: string;
  links: string[];
  status: "submitted" | "drafting" | "ready" | "published";
  profileId: string | null;
  createdAt: string;
};

const statusLabel: Record<ProfileStartItem["status"], string> = {
  submitted: "New",
  drafting: "Draft started",
  ready: "Email sent",
  published: "Published",
};

export function ProfileStartQueue({ requests }: { requests: ProfileStartItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function start(id: string) {
    setError("");
    setNotice("");
    setBusyId(id);
    try {
      const result = await beginProfileDraft(id);
      if (!result.ok || !result.profileId) {
        setError(result.ok ? "The draft did not link to a profile." : result.message);
        return;
      }
      router.push(joinPath({ edit: true, forId: result.profileId }));
    } catch {
      setError("We couldn't start that draft.");
    } finally {
      setBusyId(null);
    }
  }

  async function send(id: string) {
    setError("");
    setNotice("");
    setBusyId(id);
    try {
      const result = await sendDraftReadyEmail(id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotice("Email sent. They can set a password, then review and publish.");
      router.refresh();
    } catch {
      setError("We couldn't send that email.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Eyebrow>Ops</Eyebrow>
      <h1 className={`mt-1 text-ink ${sectionTitleClass}`}>Profile drafts</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">
        Start a hidden profile, fill it in by hand from their links, then email
        them when it is ready. Nothing here is public until they publish it.
        To edit any other therapist at any step, use Edit profile on Uploads.
      </p>

      {notice ? (
        <div className="mt-4">
          <Notice>{notice}</Notice>
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <Notice role="alert">{error}</Notice>
        </div>
      ) : null}

      {requests.length === 0 ? (
        <Card className="mt-6 px-4 py-3">
          <p className="text-sm text-mute">No profile requests yet.</p>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {requests.map((request) => {
            const busy = busyId === request.id;
            return (
              <Card as="li" key={request.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-black">{request.name}</p>
                    <p className="mt-1 text-sm text-mute">{request.email}</p>
                  </div>
                  <span className={tagClass(request.status === "published")}>
                    {statusLabel[request.status]}
                  </span>
                </div>
                <ul className="mt-3 space-y-1">
                  {request.links.map((link) => (
                    <li key={link} className="truncate text-sm">
                      <a
                        href={link}
                        className={textLinkClass}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {request.profileId ? (
                    <Button
                      href={joinPath({ edit: true, forId: request.profileId })}
                      size="sm"
                    >
                      Edit draft
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => void start(request.id)}
                    >
                      {busy ? "Starting…" : "Start draft"}
                    </Button>
                  )}
                  {request.profileId && request.status !== "published" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void send(request.id)}
                    >
                      {request.status === "ready"
                        ? "Send the ready email again"
                        : "Email them that it's ready"}
                    </Button>
                  ) : null}
                  {request.profileId ? (
                    <Link
                      href={routes.therapist(request.profileId)}
                      className={`${textLinkClass} self-center`}
                    >
                      View profile
                    </Link>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </main>
  );
}
