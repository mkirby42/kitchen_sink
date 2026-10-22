import Link from "next/link";
import { TrackProfileView } from "@/components/analytics/TrackProfileView";
import { NotAcceptingClients } from "@/components/profile/NotAcceptingClients";
import { FindConsultLink } from "@/components/search/FindConsultLink";
import { FindDetailStack } from "@/components/search/FindDetailStack";
import { FindDetailStage } from "@/components/search/FindDetailStage";
import { ArrowMark } from "@/components/search/find-marks";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { metaLineClass, textActionClass } from "@/components/ui/styles";
import { carouselStatus } from "@/lib/search/find-desktop";
import type { FindDetailContent } from "@/lib/search/find-detail";
import { DRAFT_PROFILE_LABEL } from "@/lib/therapists/listing";

export function FindDesktopDetail({
  detail,
  index,
  count,
  previousHref,
  nextHref,
  backHref,
}: {
  detail: FindDetailContent;
  index: number;
  count: number;
  previousHref: string | null;
  nextHref: string | null;
  backHref: string;
}) {
  const status = carouselStatus(index, count);
  const showBar = Boolean(nextHref || detail.consult || detail.book);

  return (
    <div data-find-detail={detail.id} className={showBar ? "pb-28" : undefined}>
      <TrackProfileView therapistId={detail.id} />
      <div className="mx-auto flex max-w-3xl items-baseline justify-between gap-4">
        <p className="font-sans text-[14px] leading-5 text-meta">{status}</p>
        <Link href={backHref} className={textActionClass}>
          All matches
        </Link>
      </div>

      <div className="mx-auto mt-4 max-w-3xl">
        <h2 className="font-display text-[40px] leading-[1.15] font-medium text-black">
          {detail.name}
        </h2>
        {detail.credentialLine ? (
          <p className={`mt-1 ${metaLineClass}`}>{detail.credentialLine}</p>
        ) : null}
        <NotAcceptingClients open={!detail.closed} className="mt-3" />
        {detail.draft ? (
          <HiddenFromPublicBadge variant="card" label={DRAFT_PROFILE_LABEL} />
        ) : null}
        {detail.hidden ? <HiddenFromPublicBadge variant="card" /> : null}
      </div>

      <div className="mx-auto mt-6 flex max-w-5xl items-center gap-3 sm:gap-5">
        <SideControl
          href={previousHref}
          label="Previous therapist"
          caption="Previous"
          direction="left"
          filled={false}
        />
        <div className="min-w-0 flex-1">
          <FindDetailStage
            name={detail.name}
            photoUrl={detail.photoUrl}
            videoUrl={detail.videoUrl}
          />
        </div>
        <SideControl
          href={nextHref}
          label="Next therapist"
          caption="Next therapist"
          direction="right"
          filled
        />
      </div>

      <FindDetailStack detail={detail} />

      {showBar ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
            <p className="min-w-0 truncate font-sans text-[15px] text-meta">
              {detail.name}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              {nextHref ? (
                <Link
                  href={nextHref}
                  className="inline-flex items-center rounded-full border border-line bg-paper px-4 py-2.5 font-sans text-[15px] font-medium text-ink"
                >
                  Next therapist
                  <span aria-hidden> →</span>
                </Link>
              ) : null}
              {detail.book ? (
                <FindConsultLink
                  href={detail.book.href}
                  therapistId={detail.id}
                  cta={detail.book.cta}
                  label="Book a session"
                  tone="paper"
                />
              ) : null}
              {detail.consult ? (
                <FindConsultLink
                  href={detail.consult.href}
                  therapistId={detail.id}
                  cta={detail.consult.cta}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SideControl({
  href,
  label,
  caption,
  direction,
  filled,
}: {
  href: string | null;
  label: string;
  caption: string;
  direction: "left" | "right";
  filled: boolean;
}) {
  const shape = filled
    ? "flex size-11 items-center justify-center rounded-full bg-heading text-white"
    : "flex size-11 items-center justify-center rounded-full border border-line bg-paper text-ink";
  return (
    <div className="flex w-16 shrink-0 flex-col items-center sm:w-20">
      {href ? (
        <Link href={href} aria-label={label} className={shape}>
          <ArrowMark direction={direction} />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-label={label}
          className={`${shape} opacity-40`}
        >
          <ArrowMark direction={direction} />
        </button>
      )}
      <span className="mt-2 text-center font-sans text-[11px] leading-4 text-meta">
        {caption}
      </span>
    </div>
  );
}
