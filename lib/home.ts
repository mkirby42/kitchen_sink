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

/** Homepage cards. The public therapist card matches the landing mock. Signed-in account links are added on that card. */
export function homePanels(state: {
  signedIn: boolean;
  therapistId: string | null;
  admin?: boolean;
}): { client: HomePanel; therapist: HomePanel } {
  const therapistActions: HomeAction[] = [createProfile, logIn];

  if (state.therapistId) {
    therapistActions.push({
      href: routes.therapist(state.therapistId),
      label: "My profile",
      variant: "secondary",
    });
  }

  if (state.admin) {
    therapistActions.push(
      {
        href: routes.adminMedia,
        label: "Upload therapist media",
        variant: "secondary",
      },
      {
        href: routes.adminReviews,
        label: "Review queue",
        variant: "secondary",
      },
    );
  }

  return {
    client: {
      title: "Find a therapist who actually fits.",
      body: "Tap the tags you need. We show therapists who match some of them.",
      actions: [findAction],
    },
    therapist: {
      title: "Meet clients who are ready to bring it all.",
      actions: therapistActions,
    },
  };
}
