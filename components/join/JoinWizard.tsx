"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJoinFeedback } from "@/lib/feedback/actions";
import { finishJoin } from "@/lib/join/finish";
import {
  editorSaveActions,
  profileSaveRpc,
  withPublishArg,
  type EditorSaveAction,
} from "@/lib/join/publish";
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
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pageTitleClass } from "@/components/ui/styles";
import { DeleteProfile } from "./DeleteProfile";
import { JoinSaveBar } from "./JoinSaveBar";
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
  profileId = userId,
  email,
  initialStep,
  initialDraft,
  editing = false,
  published,
  notice,
  adminTest = false,
}: {
  userId: string;
  /** Profile being edited. Differs from userId when an admin edits someone else. */
  profileId?: string;
  email: string;
  initialStep: Step;
  initialDraft?: JoinDraft;
  editing?: boolean;
  /** Omitted: an in-progress edit is treated as already published. */
  published?: boolean;
  notice?: string;
  adminTest?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [draft, setDraft] = useState<JoinDraft>(
    () => initialDraft ?? emptyDraft(email),
  );
  const [submitting, setSubmitting] = useState(false);
  const [saveIntent, setSaveIntent] = useState<EditorSaveAction | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);
  const live = published ?? editing;
  const actions = editorSaveActions({ published: live, editing });
  const ownProfile = profileId === userId;

  function moveTo(nextStep: Step) {
    setStep(nextStep);
    setSubmitError("");
    router.replace(
      joinPath({
        step: nextStep,
        edit: editing,
        profile: ownProfile ? undefined : profileId,
      }),
      { scroll: false },
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (step === 1) {
      router.push(editing ? routes.therapist(profileId) : routes.home);
      return;
    }
    moveTo((step - 1) as Step);
  }

  function continueForward() {
    if (!canContinue(step, draft) || step >= 4) return;
    moveTo((step + 1) as Step);
  }

  async function saveProfile(intent: EditorSaveAction) {
    if (step !== 4 || !canContinue(4, draft)) return;

    setSubmitError("");
    setSaveIntent(intent);
    setSubmitting(true);
    try {
      const payload = buildJoinPayload(draft);
      const args = withPublishArg(toRpcArgs(payload), intent);
      const rpc = profileSaveRpc({ editing, ownProfile });
      const result = await finishJoin({
        feedback: !ownProfile || intent === "draft" ? null : payload.feedback,
        save: async () => {
          const { error } = await createClient().rpc(
            rpc,
            rpc === "admin_save_therapist_profile"
              ? { p_therapist_id: profileId, ...args }
              : args,
          );
          return error?.message ?? null;
        },
        notify: (body) => sendJoinFeedback(body),
      });
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      router.push(routes.therapist(profileId));
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit your profile.",
      );
    } finally {
      setSubmitting(false);
      setSaveIntent(null);
    }
  }

  const errors = currentErrors(step, draft);
  const blocked = !canContinue(step, draft);
  const hint = continueHint(step, draft);

  return (
    <JoinShell
      step={step}
      onBack={goBack}
      closeHref={editing ? routes.therapist(profileId) : routes.home}
      footer={
        <JoinSaveBar
          step={step}
          live={live}
          actions={actions}
          blocked={blocked}
          submitting={submitting}
          mediaBusy={mediaBusy}
          saveIntent={saveIntent}
          submitError={submitError}
          hint={hint}
          error={errors[0]}
          onContinue={continueForward}
          onSave={(intent) => void saveProfile(intent)}
        />
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
          userId={profileId}
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
          hideFeedback={live || !ownProfile}
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
