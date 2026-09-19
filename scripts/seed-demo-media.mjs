import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
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
}

const EMAILS = {
  "11111111-1111-4111-8111-111111111111": "maya@kitchensink.demo",
  "55555555-5555-4555-8555-555555555001": "jordan@kitchensink.demo",
  "55555555-5555-4555-8555-555555555002": "amara@kitchensink.demo",
  "55555555-5555-4555-8555-555555555003": "luis@kitchensink.demo",
  "55555555-5555-4555-8555-555555555004": "elena@kitchensink.demo",
  "55555555-5555-4555-8555-555555555005": "sam@kitchensink.demo",
  "55555555-5555-4555-8555-555555555006": "noah@kitchensink.demo",
  "55555555-5555-4555-8555-555555555007": "fatima@kitchensink.demo",
  "55555555-5555-4555-8555-555555555008": "owen@kitchensink.demo",
  "55555555-5555-4555-8555-555555555009": "mei@kitchensink.demo",
  "55555555-5555-4555-8555-555555555010": "chris@kitchensink.demo",
};

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or anon key");
}

const mediaRoot = resolve(process.cwd(), "supabase/seed/media");
const password = "seed-only";

async function uploadOne(id) {
  const email = EMAILS[id];
  if (!email) throw new Error(`No email mapped for ${id}`);
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signed = await supabase.auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session) {
    throw new Error(`${email}: ${signed.error?.message ?? "sign-in failed"}`);
  }

  const photo = readFileSync(resolve(mediaRoot, id, "photo.jpg"));
  const video = readFileSync(resolve(mediaRoot, id, "intro.mp4"));
  const photoKey = `${id}/photo.jpg`;
  const videoKey = `${id}/intro.mp4`;

  const photoUp = await supabase.storage.from("photos").upload(photoKey, photo, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (photoUp.error) throw new Error(`${email} photo: ${photoUp.error.message}`);

  const videoUp = await supabase.storage.from("videos").upload(videoKey, video, {
    upsert: true,
    contentType: "video/mp4",
  });
  if (videoUp.error) throw new Error(`${email} video: ${videoUp.error.message}`);

  await supabase.auth.signOut();
  console.log(`uploaded ${email}`);
}

const ids = readdirSync(mediaRoot).filter((name) => name.includes("-"));
for (const id of ids) {
  await uploadOne(id);
}
