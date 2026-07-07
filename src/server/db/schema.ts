import { sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  pgTable,
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
    votes: integer("votes").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // GiST for spatial (bbox / radius); GIN for layer-array overlap; btree for year.
    index("events_geom_gix").using("gist", t.geom),
    index("events_layer_ids_gin").using("gin", t.layerIds),
    index("events_year_idx").on(t.year),
    index("events_created_at_idx").on(sql`${t.createdAt} DESC`),
  ],
);
