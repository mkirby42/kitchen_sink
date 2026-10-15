export const routes = {
  home: "/",
  find: "/find",
  join: "/join",
  forTherapists: "/for-therapists",
  joinSignIn: "/join?mode=signin",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  joinEdit: "/join?edit=1",
  profileDeleted: "/profile-deleted",
  adminMedia: "/admin/media",
  adminReviews: "/admin/reviews",
  adminStarts: "/admin/starts",
  adminAnalytics: "/admin/analytics",
  therapist: (id: string) => `/t/${id}`,
} as const;

export function joinPath(opts?: {
  step?: number;
  edit?: boolean;
  mode?: "signin";
  profile?: string;
  forId?: string;
}) {
  const query = new URLSearchParams();
  if (opts?.mode) query.set("mode", opts.mode);
  if (opts?.edit) query.set("edit", "1");
  if (opts?.profile) query.set("profile", opts.profile);
  if (opts?.forId) query.set("for", opts.forId);
  if (opts?.step) query.set("step", String(opts.step));
  const suffix = query.toString();
  return suffix ? `${routes.join}?${suffix}` : routes.join;
}
