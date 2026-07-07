import { getSql } from "@/server/db/client";
import type { AtlasEvent, NewEventInput, VoteDirection } from "@/types/event";

import type { EventsRepository } from "./events-repository";

/** Raw row shape returned by the SELECT/RETURNING column list below. */
export interface EventRow {
  id: string;
  title: string;
  description: string;
  layer_ids: string[];
  lat: number | string;
  lng: number | string;
  year: number | string;
  votes: number | string;
  created_at: string | Date;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Guard: a non-uuid id can't exist, so treat it as unknown (null) not an error. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Map a DB row to the domain {@link AtlasEvent}. Pure and coercing: geom is
 * projected to lng/lat via ST_X/ST_Y, numerics are normalized (the driver may
 * hand back strings for float8/int), and created_at is an ISO string.
 */
export function mapRow(row: EventRow): AtlasEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    layerIds: row.layer_ids,
    lng: Number(row.lng),
    lat: Number(row.lat),
    votes: Number(row.votes),
    year: Number(row.year),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * Postgres/PostGIS-backed {@link EventsRepository} on Neon (Drizzle stack).
 * Durable and multi-instance-safe — `vote` is a single atomic UPDATE, replacing
 * the file store's in-process write queue. This is the store used on Vercel and
 * (via a Neon dev branch) locally when DATABASE_URL is set.
 */
export class DrizzleEventsRepository implements EventsRepository {
  async list(): Promise<AtlasEvent[]> {
    const sql = getSql();
    const rows = (await sql`
      SELECT id, title, description, layer_ids,
             ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng,
             year, votes, created_at
      FROM events
      ORDER BY created_at DESC
    `) as EventRow[];
    return rows.map(mapRow);
  }

  async add(input: NewEventInput): Promise<AtlasEvent> {
    const sql = getSql();
    const rows = (await sql`
      INSERT INTO events (title, description, layer_ids, geom, year)
      VALUES (
        ${input.title},
        ${input.description},
        ${input.layerIds}::text[],
        ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography,
        ${input.year}
      )
      RETURNING id, title, description, layer_ids,
                ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng,
                year, votes, created_at
    `) as EventRow[];
    const row = rows[0];
    if (!row) throw new Error("insert returned no row");
    return mapRow(row);
  }

  async vote(id: string, direction: VoteDirection): Promise<AtlasEvent | null> {
    if (!isUuid(id)) return null;
    const delta = direction === "up" ? 1 : -1;
    const sql = getSql();
    const rows = (await sql`
      UPDATE events SET votes = votes + ${delta}
      WHERE id = ${id}
      RETURNING id, title, description, layer_ids,
                ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng,
                year, votes, created_at
    `) as EventRow[];
    const row = rows[0];
    return row ? mapRow(row) : null;
  }
}
