import { routes } from "@/lib/routes";

export type HomeCta = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

export function homeCtas(state: {
  signedIn: boolean;
  therapistId: string | null;
  admin?: boolean;
}): HomeCta[] {
  const ctas: HomeCta[] = [
    { href: routes.find, label: "Find a therapist", variant: "primary" },
  ];

  if (state.admin) {
    ctas.push({
      href: routes.adminMedia,
      label: "Upload therapist media",
      variant: "secondary",
    });
    return ctas;
  }

  if (state.therapistId) {
    ctas.push({
      href: routes.therapist(state.therapistId),
      label: "My profile",
      variant: "secondary",
    });
    return ctas;
  }

  ctas.push({
    href: routes.join,
    label: "Join as a therapist",
    variant: "secondary",
  });

  if (!state.signedIn) {
    ctas.push({
      href: routes.joinSignIn,
      label: "Log in as a therapist",
      variant: "secondary",
    });
  }

  return ctas;
}
