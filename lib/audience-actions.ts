"use server";

import { cookies } from "next/headers";
import {
  AUDIENCE_COOKIE,
  audienceCookieFor,
  audienceCookieOptions,
} from "@/lib/audience";
import { loadNavUser } from "@/lib/nav";

export async function setAudienceView(requested: string) {
  const nav = await loadNavUser();
  const next = audienceCookieFor({
    role: nav?.role ?? null,
    requested,
  });
  if (!next) return;
  const jar = await cookies();
  jar.set(AUDIENCE_COOKIE, next, audienceCookieOptions());
}
