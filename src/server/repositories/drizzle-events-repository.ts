import { getSql } from "@/server/db/client";
import type { AtlasEvent, NewEventInput, VoteDirection } from "@/types/event";

import type { EventsRepository } from "./events-repository";

/** Sentinel bucket for votes cast without an authenticated user (open mode). */
const ANONYMOUS = "anonymous";

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
  created_by: string | null;
  created_at: string | Date;
  /** The requesting user's vote; only selected by the user-scoped list query. */
  user_vote?: VoteDirection | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Guard: a non-uuid id can't exist, so treat it as unknown (null) not an error. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** The user's current vote on an event, or null when they haven't voted. */
export type UserVote = VoteDirection | null;

/** How a vote changes the stored tally and the user's own recorded vote. */
export interface VoteTransition {
  /** Amount to add to `events.votes`. */
  delta: number;
  /** The user's resulting vote (null = toggled off). */
  next: UserVote;
}

/**
 * Pure one-vote-per-user transition. Given the user's existing vote and the
 * direction they just pressed, return the delta to apply to the net tally and
 * their resulting vote:
 *
 * - none + up   → +1, up     · none + down → −1, down   (first vote)
 * - up   + up   → −1, null   · down + down → +1, null   (toggle off)
 * - up   + down → −2, down   · down + up   → +2, up     (switch)
 *
 * No I/O: the repository reads the existing vote, calls this, then writes.
 */
export function voteTransition(
  existing: UserVote,
  direction: VoteDirection,
): VoteTransition {
  if (existing === null) {
    return { delta: direction === "up" ? 1 : -1, next: direction };
  }
  if (existing === direction) {
    // Pressing the same arrow again clears the vote.
    return { delta: direction === "up" ? -1 : 1, next: null };
  }
  // Switching sides moves the tally by two (remove old, add new).
  return { delta: direction === "up" ? 2 : -2, next: direction };
}

/**
 * Map a DB row to the domain {@link AtlasEvent}. Pure and coercing: geom is
 * projected to lng/lat via ST_X/ST_Y, numerics are normalized (the driver may
 * hand back strings for float8/int), and created_at is an ISO string. `userVote`
 * defaults to null when the query didn't scope to a user.
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
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    userVote: row.user_vote ?? null,
  };
}

/**
 * Postgres/PostGIS-backed {@link EventsRepository} on Neon (Drizzle stack).
 * Durable and multi-instance-safe. The net tally lives on `events.votes`; the
 * `event_votes` ledger records who voted which way so votes are deduplicated and
 * toggleable. This is the store used on Vercel and (via a Neon dev branch)
 * locally when DATABASE_URL is set.
 */
export class DrizzleEventsRepository implements EventsRepository {
  async list(userId?: string): Promise<AtlasEvent[]> {
    const sql = getSql();
    if (userId) {
      // LEFT JOIN the caller's ledger row so each event carries their own vote.
      const rows = (await sql`
        SELECT e.id, e.title, e.description, e.layer_ids,
               ST_Y(e.geom::geometry) AS lat, ST_X(e.geom::geometry) AS lng,
               e.year, e.votes, e.created_by, e.created_at,
               ev.direction AS user_vote
        FROM events e
        LEFT JOIN event_votes ev
          ON ev.event_id = e.id AND ev.user_id = ${userId}
        ORDER BY e.created_at DESC
      `) as EventRow[];
      return rows.map(mapRow);
    }
    const rows = (await sql`
      SELECT id, title, description, layer_ids,
             ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng,
             year, votes, created_by, created_at,
             NULL AS user_vote
      FROM events
      ORDER BY created_at DESC
    `) as EventRow[];
    return rows.map(mapRow);
  }

  async add(input: NewEventInput, userId?: string): Promise<AtlasEvent> {
    const sql = getSql();
    const rows = (await sql`
      INSERT INTO events (title, description, layer_ids, geom, year, created_by)
      VALUES (
        ${input.title},
        ${input.description},
        ${input.layerIds}::text[],
        ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography,
        ${input.year},
        ${userId ?? null}
      )
      RETURNING id, title, description, layer_ids,
                ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng,
                year, votes, created_by, created_at
    `) as EventRow[];
    const row = rows[0];
    if (!row) throw new Error("insert returned no row");
    return mapRow(row);
  }

  async vote(
    id: string,
    direction: VoteDirection,
    userId?: string,
  ): Promise<AtlasEvent | null> {
    if (!isUuid(id)) return null;
    const uid = userId ?? ANONYMOUS;
    const sql = getSql();

    // neon-http has no multi-statement transaction, so this is a read-then-write:
    // read the caller's current vote, compute the transition, then update the
    // tally and the ledger. The composite PK (event_id, user_id) guards against
    // duplicate inserts under a race; the counter update runs first so an unknown
    // id returns null without ever touching the ledger (and without an FK error).
    const existingRows = (await sql`
      SELECT direction FROM event_votes
      WHERE event_id = ${id} AND user_id = ${uid}
    `) as { direction: VoteDirection }[];
    const existing = existingRows[0]?.direction ?? null;
    const { delta, next } = voteTransition(existing, direction);

    const rows = (await sql`
      UPDATE events SET votes = votes + ${delta}
      WHERE id = ${id}
      RETURNING id, title, description, layer_ids,
                ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng,
                year, votes, created_by, created_at
    `) as EventRow[];
    const row = rows[0];
    if (!row) return null;

    if (next === null) {
      await sql`
        DELETE FROM event_votes
        WHERE event_id = ${id} AND user_id = ${uid}
      `;
    } else if (existing === null) {
      await sql`
        INSERT INTO event_votes (event_id, user_id, direction)
        VALUES (${id}, ${uid}, ${next})
      `;
    } else {
      await sql`
        UPDATE event_votes SET direction = ${next}
        WHERE event_id = ${id} AND user_id = ${uid}
      `;
    }

    return mapRow({ ...row, user_vote: next });
  }
}
