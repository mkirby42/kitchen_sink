import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import type { MetadataRoute } from "next";
import { supabasePublicConfig } from "@/lib/supabase/env";

/** Live site from the README. Override with SITE_URL when the public host changes. */
export const PRODUCTION_ORIGIN = "https://kitchen-sink-tau.vercel.app";

export const AI_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
] as const;

/** Ops UI. Allowed to be linked while signed in; not a public document. */
export const PRIVATE_PATH_PREFIX = "/admin";

export const PUBLIC_PAGES = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
    title: "Home",
    detail: "What the site is, plus links to search or join",
  },
  {
    path: "/find",
    changeFrequency: "daily",
    priority: 0.8,
    title: "Find a therapist",
    detail:
      "Search by specialty, insurance, virtual or in-person, and license state",
  },
  {
    path: "/join",
    changeFrequency: "monthly",
    priority: 0.5,
    title: "Join as a therapist",
    detail: "Create an account and publish a profile",
  },
] as const satisfies ReadonlyArray<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  title: string;
  detail: string;
}>;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function canonicalOrigin(): string {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) {
    const normalized = normalizeOrigin(explicit);
    if (normalized) return normalized;
  }
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (process.env.VERCEL_ENV === "production" && productionHost) {
    return `https://${productionHost}`;
  }
  return PRODUCTION_ORIGIN;
}

export function originFromRequest(
  hostHeader: string | null,
  protoHeader: string | null,
): string | null {
  const host = hostHeader?.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9.-]+(?::\d+)?$/.test(host)) return null;
  const forwarded = protoHeader?.split(",")[0]?.trim().toLowerCase();
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto =
    forwarded === "http" || forwarded === "https"
      ? forwarded
      : local
        ? "http"
        : "https";
  return `${proto}://${host}`;
}

/** Host that is actually serving this response (preview, local, or production). */
export async function deploymentOrigin(): Promise<string> {
  try {
    const headerList = await headers();
    const fromRequest = originFromRequest(
      headerList.get("x-forwarded-host") ?? headerList.get("host"),
      headerList.get("x-forwarded-proto"),
    );
    if (fromRequest) return fromRequest;
  } catch {
    // No request scope (unit tests, or a static call).
  }

  const vercel = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "");
  if (vercel) return `https://${vercel}`;
  return canonicalOrigin();
}

export function robotsPolicy(origin: string): MetadataRoute.Robots {
  const allowPublic = {
    allow: "/",
    disallow: PRIVATE_PATH_PREFIX,
  };
  return {
    rules: [
      { userAgent: "*", ...allowPublic },
      { userAgent: [...AI_USER_AGENTS], ...allowPublic },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}

export function absolutePageUrl(origin: string, path: string) {
  if (path === "/") return origin;
  return `${origin}${path}`;
}

export function therapistProfilePath(id: string): string | null {
  const trimmed = id.trim();
  if (!UUID.test(trimmed)) return null;
  return `/t/${trimmed}`;
}

export function sitemapEntries(
  origin: string,
  therapistIds: string[],
): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = PUBLIC_PAGES.map((page) => ({
    url: absolutePageUrl(origin, page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const seen = new Set<string>();
  for (const id of therapistIds) {
    const path = therapistProfilePath(id);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    pages.push({
      url: absolutePageUrl(origin, path),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  return pages;
}

export async function indexableTherapistIds(): Promise<string[]> {
  const config = supabasePublicConfig();
  if (!config) return [];
  try {
    const supabase = createClient(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("therapists")
      .select("profile_id")
      .eq("open_to_new_clients", true)
      .eq("listed", true)
      .order("profile_id", { ascending: true })
      .limit(1000);
    if (error || !data) return [];
    return data.map((row) => String(row.profile_id));
  } catch {
    return [];
  }
}

export function therapistMetaDescription(input: {
  name: string;
  credential: string | null;
  specialties: string[];
}): string {
  const who = input.credential
    ? `${input.name}, ${input.credential}`
    : input.name;
  const focus = input.specialties
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  if (focus) {
    return `${who}. Specialties include ${focus}. Profile on Kitchen Sink.`;
  }
  return `${who}. Therapist profile on Kitchen Sink.`;
}

export function llmsTxt(origin: string): string {
  const pages = PUBLIC_PAGES.map(
    (page) =>
      `- [${page.title}](${absolutePageUrl(origin, page.path)}): ${page.detail}`,
  ).join("\n");

  return `# Kitchen Sink

> Kitchen Sink (Talk Shoppe) is a therapist-matching site. People look up therapists by the tags they need. Therapists publish a profile with a photo, an optional intro video, specialties, insurance, licenses, rates, and contact details.

A match is overlap. The person selects tags (for example a specialty or an insurance plan). The directory lists therapists who have at least one of those tags, ranked by how many tags overlap. Session format (virtual, in-person, or both) and license state apply when those filters are set. With no filters, the list is therapists who are open to new clients and listed in the directory.

The site does not book appointments or take payment. To reach a therapist, use the email, phone, or text number on their profile.

A signed-in therapist can delete their own profile from the edit screen. That removes the public page. The login stays, so they can join again.

## Pages

${pages}

Therapist profiles are public while that therapist is open to new clients and listed in the directory. A hidden listing is left off Find and its public page. Each listed profile lives at \`${origin}/t/{id}\` and is in the sitemap (${origin}/sitemap.xml).

## Profile contents

- Name, license type, years practicing, education, and other credentials
- State licenses (number and state)
- Photo (required) and an optional intro video
- Specialties, modalities, insurance, and identity tags
- Rates: service type, session length, and price
- A short about section, conversation cards, and published reviews. A review is published only after an admin approves it. Clients are told not to include personal health information. Rejected reviews are deleted and not kept.
- Contact: email, phone, and/or text, as the therapist listed them
`;
}

function normalizeOrigin(value: string): string | null {
  try {
    const withProto = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProto).origin;
  } catch {
    return null;
  }
}
