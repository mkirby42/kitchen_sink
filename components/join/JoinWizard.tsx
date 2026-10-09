"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJoinFeedback } from "@/lib/feedback/actions";
import { finishJoin } from "@/lib/join/finish";
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
import { joinPath, routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pageTitleClass } from "@/components/ui/styles";
import { DeleteProfile } from "./DeleteProfile";
import { JoinShell } from "./JoinShell";
import { JoinStep1 } from "./JoinStep1";
import { JoinStep2 } from "./JoinStep2";
import { JoinStep3 } from "./JoinStep3";
import { JoinStep4 } from "./JoinStep4";

type Step = 1 | 2 | 3 | 4;

function emptyDraft(email: string): JoinDraft {
  return {
    name: "",
    credential: "",
    yearsPracticing: "",
    education: [""],
    credentials: [""],
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
    slidingScale: false,
    slidingScaleMinCents: null,
    slidingScaleMaxCents: null,
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
    1: "Basic info",
    2: "Photo",
    3: "Practice details",
    4: "Conversation cards and contact",
  }[step];

  const subcopy = {
    1: "This is how clients will find and recognize you across Kitchen Sink.",
    2: "A clear, friendly photo is often the first thing a client notices — profiles with one get noticed a lot more than initials on a colored circle.",
    3: "Everything below powers client search filters.",
    4: "Pick a few prompts and answer in your own voice — this is usually the first thing a client reads.",
  }[step];

  return (
    <div className="mb-9 text-center">
      <Eyebrow className="text-center">
        Step {step} of 4 · {eyebrow}
      </Eyebrow>
      <h1 className={`mx-auto mt-4 max-w-xl text-center ${pageTitleClass}`}>
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
      <p className="mx-auto mt-4 max-w-md text-center text-base leading-relaxed text-body">
        {subcopy}
      </p>
    </div>
  );
}

export function JoinWizard({
  userId,
  email,
  initialStep,
  initialDraft,
  editing = false,
  notice,
  adminTest = false,
}: {
  userId: string;
  email: string;
  initialStep: Step;
  initialDraft?: JoinDraft;
  editing?: boolean;
  notice?: string;
  adminTest?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [draft, setDraft] = useState<JoinDraft>(
    () => initialDraft ?? emptyDraft(email),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);

  function moveTo(nextStep: Step) {
    setStep(nextStep);
    setSubmitError("");
    router.replace(joinPath({ step: nextStep, edit: editing }), {
      scroll: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (step === 1) {
      router.push(editing ? routes.therapist(userId) : routes.home);
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
      const result = await finishJoin({
        feedback: payload.feedback,
        save: async () => {
          const { error } = await createClient().rpc(
            editing ? "update_therapist_profile" : "complete_therapist_join",
            toRpcArgs(payload),
          );
          return error?.message ?? null;
        },
        notify: (body) => sendJoinFeedback(body),
      });
      if (!result.ok) {
        setSubmitError(result.error);
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
      closeHref={editing ? routes.therapist(userId) : routes.home}
      footer={
        <div className="flex flex-col items-center gap-3 text-center">
          {submitError || hint || (blocked && errors[0]) ? (
            <p
              role={submitError ? "alert" : undefined}
              className={`text-sm ${
                submitError || (!hint && blocked)
                  ? "font-medium text-clay-dark"
                  : "text-mute"
              }`}
            >
              {submitError || hint || errors[0]}
            </p>
          ) : null}
          <Button
            type="button"
            disabled={blocked || submitting || mediaBusy}
            onClick={() => void continueOrSubmit()}
          >
            {submitting
              ? editing
                ? "Saving…"
                : "Submitting…"
              : step === 4
                ? editing
                  ? "Save changes →"
                  : "Submit application →"
                : "Continue →"}
          </Button>
        </div>
      }
    >
      {notice ? (
        <p className="mb-6 rounded-box bg-cream px-4 py-3 text-left text-sm leading-relaxed text-body">
          {notice}
        </p>
      ) : null}
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
        <JoinStep4
          draft={draft}
          setDraft={setDraft}
          hideFeedback={editing}
        />
      )}
      {editing && !adminTest ? (
        <DeleteProfile
          userId={userId}
          photoKey={draft.photoKey}
          videoKey={draft.videoKey}
          disabled={submitting || mediaBusy}
        />
      ) : null}
    </JoinShell>
  );
}
