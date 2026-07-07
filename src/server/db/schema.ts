import { sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * PostGIS `geography(Point,4326)`. Drizzle has no native geography type, so this
 * custom type just tells drizzle-kit to emit the right column DDL. The
 * repository reads/writes it with raw ST_* SQL (ST_X/ST_Y/ST_MakePoint), so we
 * never depend on ORM geometry serialization.
 */
const geographyPoint = customType<{ data: string }>({
  dataType() {
    return "geography(Point,4326)";
  },
});

/** Events table — the Postgres/PostGIS home of AtlasEvent (replaces the file store). */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    layerIds: text("layer_ids").array().notNull(),
    geom: geographyPoint("geom").notNull(),
    year: integer("year").notNull(),
    // Immutable BASE score (the seed's starting number). The displayed vote
    // total is DERIVED — `votes + Σ(event_votes)` — so it can never drift out of
    // sync with the ledger. The vote endpoint mutates only `event_votes`, never
    // this column. New rows start at 0, so their score is purely the ledger sum.
    votes: integer("votes").notNull().default(0),
    // Auth0 `sub` of the creator; nullable for anonymous / pre-auth rows.
    // Attribution only — never a source of authorization truth.
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // GiST for spatial (bbox / radius); GIN for layer-array overlap; btree for year.
    index("events_geom_gix").using("gist", t.geom),
    index("events_layer_ids_gin").using("gin", t.layerIds),
    index("events_year_idx").on(t.year),
    index("events_created_by_idx").on(t.createdBy),
    index("events_created_at_idx").on(sql`${t.createdAt} DESC`),
  ],
);

/**
 * One-vote-per-user ledger — the sole source of vote truth. The displayed score
 * is derived as `events.votes` (immutable base/seed) plus this table's signed sum
 * (up:+1, down:-1); nothing mutates a counter, so the two can't drift. This table
 * records *who* voted which way so a vote can be toggled/switched and
 * de-duplicated. The composite PK (event_id, user_id) enforces "one vote per user
 * per event" and lets the vote endpoint upsert idempotently under a race.
 */
export const eventVotes = pgTable(
  "event_votes",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    // Auth0 `sub`, or the "anonymous" sentinel in open/offline mode.
    userId: text("user_id").notNull(),
    // "up" | "down" — validated in the repository, not at the column level.
    direction: text("direction").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.userId] }),
    index("event_votes_event_id_idx").on(t.eventId),
  ],
);
