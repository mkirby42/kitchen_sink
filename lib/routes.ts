export const routes = {
  home: "/",
  find: "/find",
  join: "/join",
  joinSignIn: "/join?mode=signin",
  joinEdit: "/join?edit=1",
  profileDeleted: "/profile-deleted",
  adminMedia: "/admin/media",
  adminReviews: "/admin/reviews",
  therapist: (id: string) => `/t/${id}`,
} as const;

export function joinPath(opts?: {
  step?: number;
  edit?: boolean;
  mode?: "signin";
}) {
  const query = new URLSearchParams();
  if (opts?.mode) query.set("mode", opts.mode);
  if (opts?.edit) query.set("edit", "1");
  if (opts?.step) query.set("step", String(opts.step));
  const suffix = query.toString();
  return suffix ? `${routes.join}?${suffix}` : routes.join;
}
