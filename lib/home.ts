import { routes } from "@/lib/routes";

export type HomeAction = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

export type HomePanel = {
  title: string;
  body?: string;
  actions: HomeAction[];
};

const findAction: HomeAction = {
  href: routes.find,
  label: "Find a therapist",
  variant: "primary",
};

/** Homepage client card. The therapist start section is separate. */
export function homePanels(): { client: HomePanel } {
  return {
    client: {
      title: "Find a therapist who Gets You.",
      body: "Tap the tags you need. We show therapists who match some of them.",
      actions: [findAction],
    },
  };
}
