import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Load `.env.local` into process.env when present. CI uses repo secrets instead. */
export function loadEnvLocal() {
  if (process.env.CI) return;
  const path = resolve(process.cwd(), ".env.local");
  try {
    const text = readFileSync(path, "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // no local env file
  }
}

loadEnvLocal();
