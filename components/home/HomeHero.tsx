"use client";

import Link from "next/link";
import { useState } from "react";
import type { HomeAction, HomeAudience, HomePanel } from "@/lib/home";

const audiences: { id: HomeAudience; label: string }[] = [
  { id: "client", label: "Connect with a Therapist" },
  { id: "therapist", label: "Therapist who is ready to connect" },
];

function actionClass(variant: HomeAction["variant"]) {
  return variant === "primary"
    ? "rounded-full bg-clay px-6 py-2.5 text-sm font-medium text-paper hover:bg-clay-dark"
    : "rounded-full border border-ink/15 bg-paper px-6 py-2.5 text-sm font-medium text-ink hover:border-ink/30";
}

function AudiencePanel({
  audience,
  panel,
  active,
}: {
  audience: HomeAudience;
  panel: HomePanel;
  active: boolean;
}) {
  return (
    <section
      data-audience={audience}
      hidden={!active}
      className="mx-auto mt-8 w-full max-w-2xl rounded-[1.75rem] bg-paper px-6 py-10 shadow-[0_18px_50px_rgba(27,39,68,0.06)] sm:px-12 sm:py-12"
    >
      <h2 className="text-center font-display text-[1.7rem] leading-snug tracking-tight text-ink sm:text-3xl">
        {panel.title}
      </h2>
      {panel.body ? (
        <p className="mx-auto mt-3 max-w-md text-center text-mute">{panel.body}</p>
      ) : null}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {panel.actions.map((action) => (
          <Link key={action.label} href={action.href} className={actionClass(action.variant)}>
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeHero({
  client,
  therapist,
}: {
  client: HomePanel;
  therapist: HomePanel;
}) {
  const [audience, setAudience] = useState<HomeAudience>("therapist");
  const panels: Record<HomeAudience, HomePanel> = { client, therapist };

  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="text-center font-display text-lg text-clay sm:text-xl">
        Kitchen Sink
      </p>
      <h1 className="mx-auto mt-4 max-w-4xl text-center font-display text-[clamp(2.15rem,5vw,4.35rem)] leading-[1.05] font-medium tracking-tight text-ink">
        <span className="sm:whitespace-nowrap">
          Bring everything. <em className="text-clay">And the</em>
        </span>
        <em className="block text-clay">kitchen sink.</em>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-mute sm:text-lg">
        Connect with a therapist you can bring everything — and the kitchen sink
        — to session.
      </p>

      <div className="mt-10 flex justify-center">
        <div
          role="group"
          aria-label="Choose what you want to do"
          className="flex w-full max-w-xl flex-col gap-1 rounded-[2rem] bg-line p-1.5 sm:w-auto sm:flex-row sm:rounded-full"
        >
          {audiences.map((option) => {
            const selected = audience === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setAudience(option.id)}
                className={
                  selected
                    ? "rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper"
                    : "rounded-full px-5 py-2.5 text-sm font-medium text-ink/65 hover:text-ink"
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <AudiencePanel
        audience="client"
        panel={panels.client}
        active={audience === "client"}
      />
      <AudiencePanel
        audience="therapist"
        panel={panels.therapist}
        active={audience === "therapist"}
      />
    </main>
  );
}
