import { cookies } from "next/headers";
import { AUDIENCE_COOKIE, parseAudience } from "@/lib/audience";

export async function readAudienceCookie() {
  const jar = await cookies();
  return parseAudience(jar.get(AUDIENCE_COOKIE)?.value);
}
