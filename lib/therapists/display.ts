export function yearsPracticing(
  start: string | null | undefined,
  now = new Date(),
) {
  if (!start) return null;
  const began = new Date(start);
  if (Number.isNaN(began.getTime())) return null;
  let years = now.getFullYear() - began.getFullYear();
  const monthDelta = now.getMonth() - began.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < began.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function formatUsdFromCents(cents: number | null | undefined) {
  if (cents == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function storagePublicUrl(
  bucket: "photos" | "videos",
  key: string | null | undefined,
) {
  if (!key) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/${bucket}/${key}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
