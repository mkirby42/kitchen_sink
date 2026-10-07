// Idempotent apply for the real Travis White profile.
// Not a migration. Demo cleanup only deletes @kitchensink.demo seed ids.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
import { travisMedia, travisWhite } from "./travis-white/profile.mjs";
import { buildApplySql, buildLookupSql } from "./travis-white/sql.mjs";

const PROJECT_REF = "udgngzzzgrxjxljgtxpf";
const DEFAULT_URL = `https://${PROJECT_REF}.supabase.co`;
const PHOTO_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(root, ".env.local"), "utf8");
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
    // .env.local is optional. The command line can supply the vars.
  }
}

function usage() {
  return `Apply Travis White to project ${PROJECT_REF}.

One command (personal access token with database write, plus the service role for Storage):

  SUPABASE_ACCESS_TOKEN=sbp_... \\
  SUPABASE_SERVICE_ROLE_KEY=eyJ... \\
  NEXT_PUBLIC_SUPABASE_URL=${DEFAULT_URL} \\
  npm run apply:travis-white

Or pass the Postgres URI instead of the access token (psql required):

  DATABASE_URL=postgresql://postgres.${PROJECT_REF}:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres \\
  SUPABASE_SERVICE_ROLE_KEY=eyJ... \\
  NEXT_PUBLIC_SUPABASE_URL=${DEFAULT_URL} \\
  npm run apply:travis-white

The script does not print or store a password. Whoever can read ${travisWhite.email} claims the profile at /forgot-password, then signs in at /join?mode=signin and uses Edit.`;
}

function assertProjectUrl(url) {
  if (!url.includes(PROJECT_REF)) {
    throw new Error(
      `Refusing to apply. NEXT_PUBLIC_SUPABASE_URL must be the ${PROJECT_REF} project.`,
    );
  }
}

async function runSql(sql) {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (dbUrl) return runPsql(dbUrl, sql);
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error(`Missing DATABASE_URL or SUPABASE_ACCESS_TOKEN.\n\n${usage()}`);
  }
  return runManagementQuery(token, sql);
}

function runPsql(dbUrl, sql) {
  const child = spawnSync(
    "psql",
    [dbUrl, "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A", "-f", "-"],
    { input: sql, encoding: "utf8" },
  );
  if (child.error) {
    throw new Error(
      `psql failed to start (${child.error.message}). Install postgresql-client, or use SUPABASE_ACCESS_TOKEN instead.`,
    );
  }
  if (child.status !== 0) {
    throw new Error(child.stderr || child.stdout || `psql exited ${child.status}`);
  }
  return child.stdout;
}

async function runManagementQuery(token, query) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Management API ${response.status}: ${text}`);
  }
  return text;
}

function idFromLookup(payload) {
  const trimmed = payload.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    const row = Array.isArray(parsed) ? parsed[0] : parsed;
    if (row?.id) return String(row.id);
  } catch {
    // psql -t -A prints the uuid alone.
  }
  const match = trimmed.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  return match ? match[0] : null;
}

async function uploadMedia(url, serviceKey, id) {
  const photo = readFileSync(resolve(root, travisMedia.photoPath));
  const video = readFileSync(resolve(root, travisMedia.videoPath));
  if (photo.length > PHOTO_MAX) {
    throw new Error(`Photo is ${photo.length} bytes. The photos bucket allows 5MB.`);
  }
  if (video.length > VIDEO_MAX) {
    throw new Error(`Video is ${video.length} bytes. The videos bucket allows 50MB.`);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const photoUp = await supabase.storage
    .from("photos")
    .upload(`${id}/photo.jpg`, photo, {
      upsert: true,
      contentType: travisMedia.photoContentType,
    });
  if (photoUp.error) throw new Error(`photo: ${photoUp.error.message}`);

  const videoUp = await supabase.storage
    .from("videos")
    .upload(`${id}/intro.mp4`, video, {
      upsert: true,
      contentType: travisMedia.videoContentType,
    });
  if (videoUp.error) throw new Error(`video: ${videoUp.error.message}`);
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  assertProjectUrl(url);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(`Missing SUPABASE_SERVICE_ROLE_KEY.\n\n${usage()}`);
  }

  await runSql(buildApplySql());
  const lookup = await runSql(buildLookupSql());
  const id = idFromLookup(lookup);
  if (!id) throw new Error(`Profile SQL ran but no auth user id came back.\n${lookup}`);

  await uploadMedia(url, serviceKey, id);
  console.log(`Applied Travis White (${travisWhite.email})`);
  console.log(`profile id: ${id}`);
  console.log(`https://kitchen-sink-tau.vercel.app/t/${id}`);
  console.log(
    `Claim: /forgot-password for ${travisWhite.email}, then /join?mode=signin, then Edit.`,
  );
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
