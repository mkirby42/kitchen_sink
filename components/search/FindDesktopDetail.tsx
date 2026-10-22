import type { ReactNode } from "react";
import Link from "next/link";
import { TrackProfileView } from "@/components/analytics/TrackProfileView";
import { FindConsultLink } from "@/components/search/FindConsultLink";
import { FindDetailStage } from "@/components/search/FindDetailStage";
import {
  ArrowMark,
  BadgeMark,
  CardMark,
  ClockMark,
  DocMark,
  PinMark,
  ScreenMark,
} from "@/components/search/find-marks";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { Card } from "@/components/ui/Card";
import { metaLineClass, textActionClass } from "@/components/ui/styles";
import { carouselStatus } from "@/lib/search/find-desktop";
import type { FindDetailContent } from "@/lib/search/find-grid";
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
  const showBar = Boolean(nextHref || detail.consult);

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

      <div className="mx-auto mt-5 max-w-3xl space-y-3">
        {detail.lead ? <PromptCard card={detail.lead} /> : null}
        <Facts detail={detail} />
        {detail.rest.map((card, index) => (
          <PromptCard key={`${card.prompt}-${index}`} card={card} />
        ))}
      </div>

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

function PromptCard({
  card,
}: {
  card: { prompt: string; answer: string };
}) {
  return (
    <Card as="div" className="px-6 py-5">
      <p className="font-sans text-[14px] leading-5 text-meta">{card.prompt}</p>
      <p className="mt-2 font-display text-[22px] leading-8 text-copy">
        {card.answer}
      </p>
    </Card>
  );
}

function Facts({ detail }: { detail: FindDetailContent }) {
  const facts: { key: string; icon: ReactNode; label: string }[] = [];
  if (detail.inPerson) {
    facts.push({ key: "in-person", icon: <PinMark />, label: "In person" });
  }
  if (detail.virtual) {
    facts.push({ key: "online", icon: <ScreenMark />, label: "Online" });
  }
  if (detail.yearsLabel) {
    facts.push({ key: "years", icon: <ClockMark />, label: detail.yearsLabel });
  }
  for (const label of detail.licenseFacts) {
    facts.push({ key: label, icon: <BadgeMark />, label });
  }
  if (facts.length === 0 && !detail.insuranceLine && !detail.superbill) return null;

  return (
    <Card as="div" className="px-5 py-4">
      {facts.length > 0 ? (
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {facts.map((fact) => (
            <span
              key={fact.key}
              className="inline-flex items-center gap-1.5 font-sans text-[14px] leading-5 text-copy"
            >
              {fact.icon}
              {fact.label}
            </span>
          ))}
        </div>
      ) : null}
      {detail.insuranceLine ? (
        <p
          className={`flex items-start gap-2 font-sans text-[15px] leading-6 text-copy ${facts.length > 0 ? "mt-4 border-t border-line pt-4" : ""}`}
        >
          <CardMark />
          {detail.insuranceLine}
        </p>
      ) : null}
      {detail.superbill ? (
        <div
          className={`flex items-start gap-2 ${facts.length > 0 || detail.insuranceLine ? "mt-4 border-t border-line pt-4" : ""}`}
        >
          <DocMark />
          <div>
            <p className="font-sans text-[15px] leading-5 font-medium text-copy">
              Out-of-network superbill
            </p>
            <p className="mt-0.5 font-sans text-[13px] leading-5 text-meta">
              Paying yourself? Get reimbursed later
            </p>
          </div>
        </div>
      ) : null}
    </Card>
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
