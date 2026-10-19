"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Tag } from "@/components/ui/Tag";
import { fieldLabelClass, textLinkClass } from "@/components/ui/styles";
import {
  AGE_RANGES,
  AREA_OPTIONS,
  FOCUS_AREAS,
  FORMAT_OPTIONS,
  PAYMENT_OPTIONS,
  REFERRAL_ATTESTATION,
  REFERRAL_PRIVACY_NOTE,
  TIMING_OPTIONS,
  formatLabel,
  referralDraftError,
  timingLabel,
  type ReferralDraft,
} from "@/lib/referrals/options";
import { referralError } from "@/lib/referrals/rows";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { ReferralShell } from "./ReferralBits";

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function ReferralForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<ReferralDraft>({
    ageRange: "Adult, 30s",
    focusAreas: [],
    payments: [],
    formats: [],
    area: "",
    timings: [],
    attested: false,
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inPerson = draft.formats.includes("in_person");

  function patch(next: Partial<ReferralDraft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  async function submit() {
    setMessage("");
    const next = { ...draft, area: inPerson ? draft.area : "" };
    const problem = referralDraftError(next);
    if (problem) {
      setMessage(problem);
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("create_referral_post", {
        p_age_range: next.ageRange,
        p_focus_areas: next.focusAreas,
        p_payments: next.payments,
        p_formats: next.formats,
        p_area: next.area.trim() || null,
        p_timings: next.timings,
        p_attested: true,
      });
      if (error) {
        setMessage(referralError(error));
        return;
      }
      router.push(`${routes.referralMine}?sent=1`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn't update that referral.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ReferralShell
      eyebrow="New referral"
      title="Who are you looking for?"
      lede="Your post appears on the referral board after Kitchen Sink approves it. Matching therapists tap interested, and you email the list to your client from your own email."
      action={
        <Link href={routes.referrals} className={textLinkClass}>
          Cancel
        </Link>
      }
    >
      <div className="space-y-6">
        <p className="rounded-box bg-lavender px-4 py-3 text-sm leading-relaxed text-ink">
          {REFERRAL_PRIVACY_NOTE}
        </p>
        <SelectField
          label="Client age range"
          value={draft.ageRange}
          onChange={(event) => patch({ ageRange: event.target.value })}
        >
          {AGE_RANGES.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </SelectField>
        <ChipSet
          label="Focus areas"
          options={FOCUS_AREAS.map((label) => ({ value: label, label }))}
          selected={draft.focusAreas}
          onToggle={(value) => patch({ focusAreas: toggle(draft.focusAreas, value) })}
        />
        <ChipSet
          label="Payment"
          options={PAYMENT_OPTIONS.map((label) => ({ value: label, label }))}
          selected={draft.payments}
          onToggle={(value) => patch({ payments: toggle(draft.payments, value) })}
        />
        <ChipSet
          label="Format and timing"
          options={[
            ...FORMAT_OPTIONS.map((value) => ({ value, label: formatLabel(value) })),
            ...TIMING_OPTIONS.map((value) => ({ value, label: timingLabel(value) })),
          ]}
          selected={[...draft.formats, ...draft.timings]}
          onToggle={(value) => {
            if (FORMAT_OPTIONS.includes(value as (typeof FORMAT_OPTIONS)[number])) {
              const formats = toggle(draft.formats, value);
              patch({
                formats,
                area: formats.includes("in_person") ? draft.area : "",
              });
              return;
            }
            patch({ timings: toggle(draft.timings, value) });
          }}
        />
        {inPerson ? (
          <SelectField
            label="General area"
            value={draft.area}
            onChange={(event) => patch({ area: event.target.value })}
            hint="Optional. A neighborhood, not an address."
          >
            <option value="">No area</option>
            {AREA_OPTIONS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </SelectField>
        ) : null}
        <label className="flex gap-3 rounded-box border border-line bg-paper px-4 py-3 text-sm leading-relaxed text-body">
          <input
            type="checkbox"
            className="mt-1 accent-ink"
            checked={draft.attested}
            onChange={(event) => patch({ attested: event.target.checked })}
          />
          <span>{REFERRAL_ATTESTATION}</span>
        </label>
        {message ? <Notice role="alert">{message}</Notice> : null}
        <Button
          type="button"
          variant="solid"
          size="label"
          className="w-full"
          disabled={submitting}
          onClick={() => void submit()}
        >
          {submitting ? "Please wait…" : "Post referral →"}
        </Button>
        <p className="text-center text-sm text-mute">
          Closes automatically in 7 days, once it is approved.
        </p>
      </div>
    </ReferralShell>
  );
}

function ChipSet({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className={fieldLabelClass}>{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <Tag
            key={option.value}
            selected={selected.includes(option.value)}
            onClick={() => onToggle(option.value)}
          >
            {option.label}
          </Tag>
        ))}
      </div>
    </fieldset>
  );
}
