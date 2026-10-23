import { assertTestProject } from "./seed-test/guard.mjs";
import { seedTestProject } from "./seed-test/seed.mjs";

const env = assertTestProject({
  url: process.env.TEST_SUPABASE_URL,
  anonKey: process.env.TEST_SUPABASE_ANON_KEY,
  serviceKey: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
});

await seedTestProject(env);
