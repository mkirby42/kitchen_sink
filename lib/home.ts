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

export type HomeAudience = "client" | "therapist";

const findAction: HomeAction = {
  href: routes.find,
  label: "Find a therapist",
  variant: "primary",
};

const createProfile: HomeAction = {
  href: routes.join,
  label: "Create a profile",
  variant: "primary",
};

const logIn: HomeAction = {
  href: routes.joinSignIn,
  label: "Log in",
  variant: "secondary",
};

/** Homepage cards. The therapist card is Create a profile and Log in for every visitor. */
export function homePanels(): { client: HomePanel; therapist: HomePanel } {
  return {
    client: {
      title: "Find a therapist who Gets You.",
      body: "Tap the tags you need. We show therapists who match some of them.",
      actions: [findAction],
    },
    therapist: {
      title: "Meet clients who are ready to bring it all.",
      actions: [createProfile, logIn],
    },
  };
}
