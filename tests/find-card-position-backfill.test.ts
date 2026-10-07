import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const ONE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const FIVE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const migration = readFileSync(
  resolve(
    "supabase/migrations/20261007220000_find_card_video_and_conversation.sql",
  ),
  "utf8",
);

const cardCount = readFileSync(
  resolve("supabase/migrations/20260924183000_conversation_card_count.sql"),
  "utf8",
);

function backfillSql(sql: string) {
  const marker = "drop function if exists public.search_therapists";
  const at = sql.indexOf(marker);
  if (at < 0) throw new Error("search_therapists drop is missing");
  return sql.slice(0, at);
}

describe("find card position backfill", () => {
  it("assigns positions for a 1-card and a 5-card therapist and leaves the card-count trigger on", async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        create role anon;
        create role authenticated;
        create role service_role;
        create table public.therapists (
          profile_id uuid primary key
        );
        create table public.profile_items (
          id uuid primary key,
          therapist_id uuid not null references public.therapists (profile_id),
          prompt text not null,
          answer text not null,
          tag text not null
        );
        insert into public.therapists (profile_id) values ('${ONE_ID}'), ('${FIVE_ID}');
        insert into public.profile_items (id, therapist_id, prompt, answer, tag)
        values (
          'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          '${ONE_ID}',
          'only card',
          'one',
          'about'
        );
      `);
      const five = Array.from({ length: 5 }, (_, index) => {
        const id = `dddddddd-dddd-4ddd-8ddd-ddddddddddd${index}`;
        return `('${id}', '${FIVE_ID}', 'card ${index}', 'answer ${index}', 'about')`;
      }).join(",\n");
      await db.exec(`
        insert into public.profile_items (id, therapist_id, prompt, answer, tag)
        values ${five};
      `);
      await db.exec(cardCount);
      await db.exec(backfillSql(migration));

      const counts = await db.query<{
        therapist_id: string;
        n: number;
        distinct_positions: number;
        min_position: number;
        max_position: number;
      }>(`
        select
          therapist_id::text,
          count(*)::int as n,
          count(distinct position)::int as distinct_positions,
          min(position)::int as min_position,
          max(position)::int as max_position
        from public.profile_items
        group by therapist_id
        order by n
      `);
      expect(counts.rows).toEqual([
        {
          therapist_id: ONE_ID,
          n: 1,
          distinct_positions: 1,
          min_position: 0,
          max_position: 0,
        },
        {
          therapist_id: FIVE_ID,
          n: 5,
          distinct_positions: 5,
          min_position: 0,
          max_position: 4,
        },
      ]);

      const trigger = await db.query<{ tgenabled: string }>(`
        select tgenabled::text
        from pg_trigger
        where tgname = 'profile_items_card_count'
          and tgrelid = 'public.profile_items'::regclass
      `);
      expect(trigger.rows.map((row) => row.tgenabled)).toEqual(["O"]);
    } finally {
      await db.close();
    }
  }, 30000);
});
