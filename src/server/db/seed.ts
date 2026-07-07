import { neon } from "@neondatabase/serverless";

import seedEvents from "../../data/seed-events.json" with { type: "json" };

/**
 * Idempotent seed: loads the committed demo events into Postgres only when the
 * table is empty. Ids are DB-generated uuids (the JSON's string ids were only
 * meaningful to the old file store); votes/createdAt are preserved so ranking
 * and recency look realistic. Run with `pnpm db:seed` (needs DATABASE_URL).
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const sql = neon(url);

  const [{ count }] =
    (await sql`SELECT count(*)::int AS count FROM events`) as [
      { count: number },
    ];
  if (count > 0) {
    console.log(`events already has ${count} rows — skipping seed`);
    return;
  }

  for (const e of seedEvents) {
    await sql`
      INSERT INTO events (title, description, layer_ids, geom, year, votes, created_at)
      VALUES (
        ${e.title},
        ${e.description},
        ${e.layerIds},
        ST_SetSRID(ST_MakePoint(${e.lng}, ${e.lat}), 4326)::geography,
        ${e.year},
        ${e.votes},
        ${e.createdAt}
      )
    `;
  }
  console.log(`seeded ${seedEvents.length} events`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
