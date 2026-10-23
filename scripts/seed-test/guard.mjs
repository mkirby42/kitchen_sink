/** Refuse anything except the dedicated test project. Never fall back to prod env. */

export const PROD_REF = "udgngzzzgrxjxljgtxpf";
export const TEST_REF = "kxlonrjirrrjiinclamc";

const MISSING =
  "Set TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, and TEST_SUPABASE_SERVICE_ROLE_KEY. This script does not read NEXT_PUBLIC_SUPABASE_URL.";

export function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

export function jwtClaims(key) {
  const part = key?.split(".")[1];
  if (!part) return null;
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function assertTestProject(env) {
  const url = env.url?.trim() ?? "";
  const anonKey = env.anonKey?.trim() ?? "";
  const serviceKey = env.serviceKey?.trim() ?? "";
  if (!url || !anonKey || !serviceKey) {
    throw new Error(MISSING);
  }

  const ref = projectRefFromUrl(url);
  if (url.includes(PROD_REF) || ref === PROD_REF) {
    throw new Error(`Refusing to seed the production project ${PROD_REF}.`);
  }
  if (ref !== TEST_REF) {
    throw new Error(
      `Refusing to seed project ${ref || "(unparsed)"}. Only ${TEST_REF} is allowed.`,
    );
  }

  const anon = jwtClaims(anonKey);
  const service = jwtClaims(serviceKey);
  if (anon?.ref === PROD_REF || service?.ref === PROD_REF) {
    throw new Error(`Refusing to seed the production project ${PROD_REF}.`);
  }
  if (anon?.ref !== TEST_REF || anon?.role !== "anon") {
    throw new Error(`TEST_SUPABASE_ANON_KEY is not the anon key for ${TEST_REF}.`);
  }
  if (service?.ref !== TEST_REF || service?.role !== "service_role") {
    throw new Error(
      `TEST_SUPABASE_SERVICE_ROLE_KEY is not the service role key for ${TEST_REF}.`,
    );
  }
  if (anonKey === serviceKey) {
    throw new Error("The anon key and the service role key must be different.");
  }

  return { url, anonKey, serviceKey };
}
