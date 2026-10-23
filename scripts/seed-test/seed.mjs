import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TEST_REF } from "./guard.mjs";
import {
  PASSWORD,
  everyone,
  joinArgs,
  openTherapists,
} from "./fixtures.mjs";

const mediaRoot = resolve(process.cwd(), "scripts/seed-test/placeholders");
const photo = readFileSync(resolve(mediaRoot, "photo.jpg"));
const video = readFileSync(resolve(mediaRoot, "intro.mp4"));
const voice = readFileSync(resolve(mediaRoot, "prompt.wav"));

function client(url, key) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function unwrap(label, result) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

async function findAuthUser(service, email) {
  for (let page = 1; page <= 10; page += 1) {
    const data = unwrap(
      "list users",
      await service.auth.admin.listUsers({ page, perPage: 200 }),
    );
    const hit = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function deleteAuthUser(service, id) {
  const existing = await service.auth.admin.getUserById(id);
  if (existing.error || !existing.data?.user) return;
  for (const bucket of ["photos", "videos", "voice"]) {
    const listed = await service.storage.from(bucket).list(id);
    const names = (listed.data ?? []).map((file) => `${id}/${file.name}`);
    if (names.length > 0) {
      const removed = await service.storage.from(bucket).remove(names);
      if (removed.error) throw new Error(`${id} ${bucket}: ${removed.error.message}`);
    }
  }
  await service.from("profiles").delete().eq("id", id);
  unwrap(`delete ${id}`, await service.auth.admin.deleteUser(id));
}

async function resetAuthUser(service, sample) {
  const byId = await service.auth.admin.getUserById(sample.id);
  if (!byId.error && byId.data?.user) {
    unwrap(
      `update ${sample.email}`,
      await service.auth.admin.updateUserById(sample.id, {
        email: sample.email,
        password: PASSWORD,
        email_confirm: true,
      }),
    );
    return;
  }

  const stray = await findAuthUser(service, sample.email);
  if (stray && stray.id !== sample.id) await deleteAuthUser(service, stray.id);
  unwrap(
    `create ${sample.email}`,
    await service.auth.admin.createUser({
      id: sample.id,
      email: sample.email,
      password: PASSWORD,
      email_confirm: true,
    }),
  );
}

async function uploadMedia(service, sample) {
  if (sample.media === "none") return;
  const photoUp = await service.storage.from("photos").upload(
    `${sample.id}/photo.jpg`,
    photo,
    { upsert: true, contentType: "image/jpeg" },
  );
  if (photoUp.error) throw new Error(`${sample.name} photo: ${photoUp.error.message}`);
  if (sample.media === "video") {
    const videoUp = await service.storage.from("videos").upload(
      `${sample.id}/intro.mp4`,
      video,
      { upsert: true, contentType: "video/mp4" },
    );
    if (videoUp.error) throw new Error(`${sample.name} video: ${videoUp.error.message}`);
  }
  if (sample.media === "voice") {
    const voiceUp = await service.storage.from("voice").upload(
      `${sample.id}/prompt.wav`,
      voice,
      { upsert: true, contentType: "audio/wav" },
    );
    if (voiceUp.error) throw new Error(`${sample.name} voice: ${voiceUp.error.message}`);
  }
}

async function signIn(url, anonKey, sample) {
  const user = client(url, anonKey);
  let last = "sign-in failed";
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const signed = await user.auth.signInWithPassword({
      email: sample.email,
      password: PASSWORD,
    });
    if (!signed.error && signed.data.session) return user;
    last = signed.error?.message ?? last;
    const paused = /rate|too many|429/i.test(last);
    if (!paused || attempt === 4) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  throw new Error(`${sample.email}: ${last}`);
}

async function publish(service, url, anonKey, sample) {
  unwrap(
    `clear ${sample.name}`,
    await service.from("profiles").delete().eq("id", sample.id),
  );
  const user = await signIn(url, anonKey, sample);
  const saved = await user.rpc("complete_therapist_join", joinArgs(sample));
  if (saved.error) throw new Error(`${sample.name}: ${saved.error.message}`);
  await user.auth.signOut();
}

async function expectDirectory(anon) {
  const rows = unwrap(
    "search",
    await anon.rpc("search_therapists", {
      p_tags: [],
      p_virtual: false,
      p_in_person: false,
      p_state: null,
      p_limit: 24,
      p_offset: 0,
    }),
  );
  const names = rows.map((row) => row.name);
  const expected = openTherapists.map((sample) => sample.name);
  if (names.join("\n") !== expected.join("\n")) {
    throw new Error(
      `Find should list only the ${expected.length} open samples.\nGot: ${names.join(", ") || "(none)"}`,
    );
  }
}

export async function seedTestProject({ url, anonKey, serviceKey }) {
  const service = client(url, serviceKey);
  const anon = client(url, anonKey);
  for (const sample of everyone) {
    await resetAuthUser(service, sample);
    await uploadMedia(service, sample);
    await publish(service, url, anonKey, sample);
    console.log(`seeded ${sample.name} (${sample.published ? "published" : "draft"}, ${sample.open ? "open" : "closed"})`);
  }
  await expectDirectory(anon);
  console.log(`Seeded ${everyone.length} sample therapists on ${TEST_REF}.`);
}
