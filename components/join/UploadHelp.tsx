"use client";

import { useEffect, useId, useRef } from "react";

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
      <p className="rounded-2xl border border-clay/30 bg-cream px-5 py-4 text-center text-sm leading-6 text-ink">
        Having trouble uploading? Email{" "}
        <a href={MAILTO} className="font-semibold text-clay-dark underline">
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
          className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium hover:border-ink/20"
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
        className="m-auto w-[min(calc(100%-2rem),24rem)] rounded-[1.75rem] border-0 bg-paper p-6 text-ink shadow-[0_24px_70px_rgba(27,39,68,0.18)] backdrop:bg-ink/40"
      >
        <h2 id={titleId} className="font-display text-3xl tracking-tight">
          Need help uploading?
        </h2>
        <p className="mt-3 text-sm leading-6 text-mute">
          If your photo or intro video won&apos;t upload, email{" "}
          <a href={MAILTO} className="font-semibold text-ink underline">
            {UPLOAD_HELP_EMAIL}
          </a>{" "}
          and the team will help.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={MAILTO}
            className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper hover:bg-clay-dark"
          >
            Email the team
          </a>
          <form method="dialog">
            <button
              type="submit"
              className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium hover:border-ink/20"
            >
              Close
            </button>
          </form>
        </div>
      </dialog>
    </section>
  );
}
