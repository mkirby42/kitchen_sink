"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/styles";

export const UPLOAD_HELP_EMAIL = "chrislo5240@gmail.com";

const MAILTO = `mailto:${UPLOAD_HELP_EMAIL}?subject=${encodeURIComponent(
  "Trouble uploading my profile photo or video",
)}`;

export function UploadHelp({ troubleToken }: { troubleToken: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (troubleToken === 0) return;
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, [troubleToken]);

  return (
    <section className="space-y-3" aria-label="Upload help">
      <p className="rounded-box bg-cream px-5 py-4 text-center text-sm leading-6 text-body">
        Having trouble uploading? Email{" "}
        <a href={MAILTO} className="font-medium text-clay underline">
          {UPLOAD_HELP_EMAIL}
        </a>{" "}
        and the team will help.
      </p>
      <div className="text-center">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            const dialog = dialogRef.current;
            if (dialog && !dialog.open) dialog.showModal();
          }}
          className={buttonClass("secondary")}
        >
          Need help uploading?
        </button>
      </div>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="m-auto w-[min(calc(100%-2rem),24rem)] rounded-card border-0 bg-paper p-6 text-body shadow-overlay backdrop:bg-black/40"
      >
        <h2 id={titleId} className="font-display text-[1.75rem] font-normal tracking-tight text-ink">
          Need help uploading?
        </h2>
        <p className="mt-3 text-sm leading-6 text-mute">
          If your photo or intro video won&apos;t upload, email{" "}
          <a href={MAILTO} className="font-medium text-clay underline">
            {UPLOAD_HELP_EMAIL}
          </a>{" "}
          and the team will help.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={MAILTO} className={buttonClass("primary")}>
            Email the team
          </a>
          <form method="dialog">
            <Button type="submit" variant="secondary">
              Close
            </Button>
          </form>
        </div>
      </dialog>
    </section>
  );
}
