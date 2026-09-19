"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JoinDraft } from "@/lib/join/types";
import { toRpcArgs } from "@/lib/join/submit";
import {
  buildJoinPayload,
  canContinue,
  continueHint,
  step1Errors,
  step2Errors,
  step3Errors,
  step4Errors,
} from "@/lib/join/validate";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { JoinShell } from "./JoinShell";
import { JoinStep1 } from "./JoinStep1";
import { JoinStep2 } from "./JoinStep2";
import { JoinStep3 } from "./JoinStep3";
import { JoinStep4 } from "./JoinStep4";

type Step = 1 | 2 | 3 | 4;

function initialDraft(email: string): JoinDraft {
  return {
    name: "",
    credential: "",
    yearsPracticing: "",
    supervisorName: "",
    supervisorLicense: "",
    licenses: [{ number: "", state: "" }],
    photoKey: null,
    videoKey: null,
    openToNewClients: true,
    virtual: false,
    inPerson: false,
    specialties: [],
    modalities: [],
    insurance: [],
    identity: [],
    location: null,
    rates: [
      {
        service_type: "Individual",
        duration_minutes: 50,
        price_cents: 0,
      },
    ],
    cards: [],
    about: "",
    email,
    phone: "",
    outreach: ["email"],
    feedback: "",
  };
}

function currentErrors(step: Step, draft: JoinDraft) {
  switch (step) {
    case 1:
      return step1Errors(draft);
    case 2:
      return step2Errors(draft);
    case 3:
      return step3Errors(draft);
    case 4:
      return step4Errors(draft);
  }
}

function Heading({ step }: { step: Step }) {
  const eyebrow = {
    1: "BASIC INFO",
    2: "PHOTO",
    3: "PRACTICE DETAILS",
    4: "CONVERSATION CARDS & CONTACT",
  }[step];

  const subcopy = {
    1: "This is how clients will find and recognize you across Kitchen Sink.",
    2: "A clear, friendly photo is often the first thing a client notices — profiles with one get noticed a lot more than initials on a colored circle.",
    3: "Everything below powers client search filters.",
    4: "Pick a few prompts and answer in your own voice — this is usually the first thing a client reads.",
  }[step];

  return (
    <div className="mb-9">
      <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
        Step {step} of 4 · {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        {step === 1 ? (
          <>
            Let&apos;s start with <em className="text-clay">you</em>.
          </>
        ) : step === 2 ? (
          <>
            Put a <em className="text-clay">face</em> to your profile.
          </>
        ) : step === 3 ? (
          <>
            Help the <em className="text-clay">right</em> clients find you.
          </>
        ) : (
          <>
            Give clients something <em className="text-clay">real</em> to read.
          </>
        )}
      </h1>
      <p className="mt-3 text-mute">{subcopy}</p>
    </div>
  );
}

export function JoinWizard({
  userId,
  email,
  initialStep,
}: {
  userId: string;
  email: string;
  initialStep: Step;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [draft, setDraft] = useState<JoinDraft>(() => initialDraft(email));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);

  function moveTo(nextStep: Step) {
    setStep(nextStep);
    setSubmitError("");
    router.replace(`${routes.join}?step=${nextStep}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (step === 1) {
      router.push(routes.home);
      return;
    }
    moveTo((step - 1) as Step);
  }

  async function continueOrSubmit() {
    if (!canContinue(step, draft)) return;
    if (step < 4) {
      moveTo((step + 1) as Step);
      return;
    }

    setSubmitError("");
    setSubmitting(true);
    try {
      const payload = buildJoinPayload(draft);
      const { error } = await createClient().rpc(
        "complete_therapist_join",
        toRpcArgs(payload),
      );
      if (error) {
        setSubmitError(error.message);
        return;
      }
      router.push(routes.therapist(userId));
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit your profile.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const errors = currentErrors(step, draft);
  const blocked = !canContinue(step, draft);
  const hint = continueHint(step, draft);

  return (
    <JoinShell
      step={step}
      onBack={goBack}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p
              role={submitError ? "alert" : undefined}
              className={`text-sm ${
                submitError || (!hint && blocked)
                  ? "font-medium text-clay-dark"
                  : "text-mute"
              }`}
            >
              {submitError || hint || (blocked ? errors[0] : "")}
            </p>
          </div>
          <button
            type="button"
            disabled={blocked || submitting || mediaBusy}
            onClick={() => void continueOrSubmit()}
            className="shrink-0 rounded-full bg-clay px-6 py-3 font-semibold text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting
              ? "Submitting…"
              : step === 4
                ? "Submit application →"
                : "Continue →"}
          </button>
        </div>
      }
    >
      <Heading step={step} />
      {step === 1 ? (
        <JoinStep1 draft={draft} setDraft={setDraft} />
      ) : step === 2 ? (
        <JoinStep2
          userId={userId}
          draft={draft}
          setDraft={setDraft}
          onBusyChange={setMediaBusy}
        />
      ) : step === 3 ? (
        <JoinStep3 draft={draft} setDraft={setDraft} />
      ) : (
        <JoinStep4 draft={draft} setDraft={setDraft} />
      )}
    </JoinShell>
  );
}
