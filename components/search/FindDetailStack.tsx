import type { ReactNode } from "react";
import { AboutLead } from "@/components/profile/AboutLead";
import { DesktopPractice } from "@/components/profile/DesktopPractice";
import { FeeRows } from "@/components/profile/FeeRows";
import { ProfileHeading } from "@/components/profile/ProfileHeading";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { possessive } from "@/components/profile/copy";
import { VoicePromptCard } from "@/components/profile/VoicePromptCard";
import {
  BadgeMark,
  CardMark,
  ClockMark,
  DocMark,
  PinMark,
  ScreenMark,
} from "@/components/search/find-marks";
import { Card } from "@/components/ui/Card";
import { smallLabelClass } from "@/components/ui/styles";
import { formatRating, reviewAuthorLabel, reviewMeta } from "@/lib/reviews/format";
import type { FindDetailContent } from "@/lib/search/find-detail";
import { reviewAverage } from "@/lib/therapists/load";

export function FindDetailStack({ detail }: { detail: FindDetailContent }) {
  return (
    <div className="mx-auto mt-5 max-w-3xl space-y-3">
      {detail.voiceUrl && detail.voicePrompt ? (
        <VoicePromptCard
          name={detail.name}
          prompt={detail.voicePrompt}
          src={detail.voiceUrl}
        />
      ) : null}
      {detail.lead ? <PromptCard card={detail.lead} /> : null}
      <Facts detail={detail} />
      {detail.rest.map((card, index) => (
        <PromptCard key={`${card.prompt}-${index}`} card={card} />
      ))}
      <DesktopPractice
        className="mt-6"
        givenName={detail.givenName}
        specialties={detail.specialties}
        modalities={detail.modalities}
        identity={detail.identity}
        education={detail.education}
        credentials={detail.credentials}
      />
      <Fees detail={detail} />
      <OwnWords detail={detail} />
    </div>
  );
}

function PromptCard({ card }: { card: { prompt: string; answer: string } }) {
  return (
    <Card as="div" className="px-6 py-5">
      <p className="font-sans text-[14px] leading-5 text-meta">{card.prompt}</p>
      <p className="mt-2 font-display text-[22px] leading-8 text-copy">{card.answer}</p>
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
  const blocks = [
    detail.insuranceLine ? (
      <p
        key="insurance"
        className="flex items-start gap-2 font-sans text-[15px] leading-6 text-copy"
      >
        <CardMark />
        {detail.insuranceLine}
      </p>
    ) : null,
    detail.cashPay ? (
      <p
        key="cash"
        className="flex items-start gap-2 font-sans text-[15px] leading-6 text-copy"
      >
        <CardMark />
        Cash pay
      </p>
    ) : null,
    detail.superbill ? (
      <div key="superbill" className="flex items-start gap-2">
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
    ) : null,
    detail.officeLines.length > 0 ? (
      <div key="office" className="flex items-start gap-2">
        <PinMark />
        <address className="not-italic font-sans text-[15px] leading-6 text-copy">
          {detail.officeLines.map((line, index) => (
            <span key={`${index}-${line}`} className="block">
              {line}
            </span>
          ))}
        </address>
      </div>
    ) : null,
  ].filter(Boolean);

  if (facts.length === 0 && blocks.length === 0) return null;

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
      {blocks.length > 0 ? (
        <div
          className={`divide-y divide-line ${facts.length > 0 ? "mt-4 border-t border-line" : ""}`}
        >
          {blocks.map((block, index) => (
            <div
              key={index}
              className={
                facts.length > 0
                  ? "py-4 first:pt-4 last:pb-0"
                  : "py-4 first:pt-0 last:pb-0"
              }
            >
              {block}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function Fees({ detail }: { detail: FindDetailContent }) {
  if (detail.fees.length === 0) return null;
  return (
    <Card as="div" className="px-6 py-5">
      <h3 className={smallLabelClass}>Fees</h3>
      <dl className="mt-1 divide-y divide-line text-sm">
        <FeeRows rows={detail.fees} />
      </dl>
    </Card>
  );
}

function OwnWords({ detail }: { detail: FindDetailContent }) {
  if (!detail.about && detail.reviews.length === 0) return null;
  return (
    <section className="pt-3">
      <ProfileHeading>{`In ${possessive(detail.givenName)} own words`}</ProfileHeading>
      <ProfileTabs
        flush
        fill={false}
        reviewCount={detail.reviews.length}
        about={
          detail.about ? (
            <Card as="div" className="px-6 py-5">
              <AboutLead about={detail.about} />
            </Card>
          ) : null
        }
        reviews={<DetailReviews detail={detail} />}
      />
    </section>
  );
}

function DetailReviews({ detail }: { detail: FindDetailContent }) {
  if (detail.reviews.length === 0) {
    return <p className="font-sans text-[15px] text-mute">No reviews yet.</p>;
  }
  const average = reviewAverage(
    detail.reviews
      .map((review) => review.stars)
      .filter((n): n is number => n != null),
  );
  const noun = detail.reviews.length === 1 ? "review" : "reviews";
  return (
    <div>
      {average != null ? (
        <p className="mt-2 font-sans text-[15px] leading-6 text-meta">
          {formatRating(average)} from {detail.reviews.length} {noun}
        </p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {detail.reviews.map((review) => {
          const meta = reviewMeta(review);
          return (
            <Card as="li" key={review.id} className="px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-black">{reviewAuthorLabel(review)}</p>
                {review.stars != null ? (
                  <p className="font-sans text-[14px] text-meta">
                    {formatRating(review.stars)}
                  </p>
                ) : null}
              </div>
              {review.body ? (
                <p className="mt-2 font-sans text-[17px] leading-7 text-copy">
                  {review.body}
                </p>
              ) : null}
              {meta ? <p className="mt-3 text-sm text-mute">{meta}</p> : null}
            </Card>
          );
        })}
      </ul>
    </div>
  );
}
