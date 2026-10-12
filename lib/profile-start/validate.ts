const EMAIL =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PROFILE_START_LINK_MAX = 8;

export function isUuid(value: string) {
  return UUID.test(value);
}

export function normalizeProfileLink(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 500 || /[\s]/.test(trimmed)) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (!url.hostname.includes(".")) return null;
  if (url.hostname.length > 253) return null;
  return url.toString();
}

export type ProfileStartInput = {
  name: string;
  email: string;
  links: string[];
  company?: string;
};

export type ProfileStartParsed =
  | { ok: true; honeypot: true }
  | { ok: true; honeypot: false; name: string; email: string; links: string[] }
  | { ok: false; message: string };

export function parseProfileStart(input: ProfileStartInput): ProfileStartParsed {
  if (input.company?.trim()) return { ok: true, honeypot: true };

  const name = input.name.replace(/[\u0000-\u001F]/g, "").trim();
  if (!name || name.length > 120) return { ok: false, message: "Enter your name." };

  const email = input.email.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) {
    return { ok: false, message: "Enter a valid email." };
  }

  const links: string[] = [];
  for (const raw of input.links) {
    const link = normalizeProfileLink(raw);
    if (!raw.trim()) continue;
    if (!link) {
      return { ok: false, message: "Use a full link, like https://www.psychologytoday.com/…" };
    }
    if (!links.includes(link)) links.push(link);
  }

  if (links.length < 1) {
    return { ok: false, message: "Add a link to a profile you already have online." };
  }
  if (links.length > PROFILE_START_LINK_MAX) {
    return { ok: false, message: "Add up to 8 links." };
  }

  return { ok: true, honeypot: false, name, email, links };
}
