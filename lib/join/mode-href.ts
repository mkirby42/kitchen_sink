import { routes } from "@/lib/routes";

const DROP = new Set([
  "mode",
  "error",
  "email",
  "sent",
  "password",
  "updated",
  "link",
]);

/** Sign-up is /join. Sign-in is /join?mode=signin. Other params stay. */
export function joinModeHref(
  mode: "signup" | "signin",
  current: { [key: string]: string | string[] | undefined },
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (DROP.has(key)) continue;
    const first = Array.isArray(value) ? value[0] : value;
    if (!first) continue;
    params.set(key, first);
  }
  if (mode === "signin") params.set("mode", "signin");
  const query = params.toString();
  return query ? `${routes.join}?${query}` : routes.join;
}
