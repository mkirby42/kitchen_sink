const MAX_WHOLE_DIGITS = 6;

/** Keep a typed dollar amount: digits, one dot, at most two decimal places. */
export function sanitizePriceDraft(raw: string): string {
  const stripped = raw.replace(/[$,\s]/g, "");
  let seenDot = false;
  let decimals = 0;
  let wholeDigits = 0;
  let out = "";

  for (const char of stripped) {
    if (char >= "0" && char <= "9") {
      if (seenDot) {
        if (decimals >= 2) continue;
        decimals += 1;
      } else {
        if (wholeDigits >= MAX_WHOLE_DIGITS) continue;
        wholeDigits += 1;
      }
      out += char;
      continue;
    }
    if (char === "." && !seenDot) {
      seenDot = true;
      out += char;
    }
  }

  return out;
}

/** Integer cents, or null while the draft is empty or still just a dot. */
export function parsePriceDraft(raw: string): number | null {
  const cleaned = sanitizePriceDraft(raw);
  if (cleaned === "" || cleaned === ".") return null;
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;

  const [whole = "0", frac = ""] = cleaned.split(".");
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  if (!Number.isSafeInteger(cents)) return null;
  return cents;
}

/** Whole dollars stay unpadded; cents always show two places. */
export function centsToPriceInput(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) return "";
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  if (remainder === 0) return String(dollars);
  return `${dollars}.${String(remainder).padStart(2, "0")}`;
}
