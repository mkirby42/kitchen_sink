"use client";

import { useState } from "react";
import { NewsletterWhy } from "@/components/home/NewsletterWhy";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { pageTitleClass, sectionTitleClass } from "@/components/ui/styles";
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
      <h2 className={`text-center text-ink ${sectionTitleClass}`}>{panel.title}</h2>
      {panel.body ? (
        <p className="mx-auto mt-3 max-w-md text-center text-base text-body">
          {panel.body}
        </p>
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
      <Eyebrow className="text-center">Kitchen Sink</Eyebrow>
      <h1 className={`mx-auto mt-4 max-w-4xl text-center ${pageTitleClass}`}>
        <span className="sm:whitespace-nowrap">Bring everything. And the</span>
        <span className="block">kitchen sink.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-body sm:text-lg">
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
