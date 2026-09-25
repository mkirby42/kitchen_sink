import { PHI_REVIEW_HEADING, PHI_REVIEW_WARNING } from "@/lib/reviews/phi";

export function PhiNotice() {
  return (
    <aside
      role="note"
      className="rounded-2xl border border-clay/40 bg-cream px-4 py-3 text-sm leading-relaxed text-ink"
    >
      <p className="font-semibold text-clay-dark">{PHI_REVIEW_HEADING}</p>
      <p className="mt-1">{PHI_REVIEW_WARNING}</p>
    </aside>
  );
}

export function ReviewPendingNote() {
  return (
    <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink">
      Waiting for approval. This review is not on the profile yet. If it is
      rejected, it is deleted and not kept.
    </p>
  );
}

export function ReviewEditNote() {
  return (
    <p className="text-sm text-mute">
      Saving changes sends this review back for approval and takes it off the
      profile until an admin approves it again.
    </p>
  );
}
