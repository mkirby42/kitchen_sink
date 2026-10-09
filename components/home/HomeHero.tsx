"use client";

import { useState } from "react";
import { NewsletterWhy } from "@/components/home/NewsletterWhy";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { HomeAudience, HomePanel } from "@/lib/home";

const audiences: { value: HomeAudience; label: string }[] = [
  { value: "client", label: "Connect with a Therapist" },
  { value: "therapist", label: "Therapist who is ready to connect" },
];

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
    <Card
      data-audience={audience}
      hidden={!active}
      tone={audience === "therapist" ? "lavender" : "paper"}
      className="mx-auto mt-8 w-full max-w-2xl px-6 py-10 sm:px-12 sm:py-12"
    >
      <h2 className="text-center font-display text-[1.7rem] leading-snug tracking-tight text-ink sm:text-3xl">
        {panel.title}
      </h2>
      {panel.body ? (
        <p className="mx-auto mt-3 max-w-md text-center text-mute">{panel.body}</p>
      ) : null}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {panel.actions.map((action) => (
          <Button
            key={action.label}
            href={action.href}
            variant={
              audience === "therapist" && action.variant === "primary"
                ? "gold"
                : action.variant
            }
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
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
      <Eyebrow className="text-center sm:text-xl">Kitchen Sink</Eyebrow>
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
        <SegmentedControl
          label="Choose what you want to do"
          value={audience}
          onChange={setAudience}
          options={audiences}
          stack
        />
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
      <NewsletterWhy />
    </main>
  );
}
