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

/** How a vote resolves: the net-tally delta and the user's own recorded vote. */
export interface VoteTransition {
  /**
   * The net-tally delta this vote represents. Kept for callers reasoning about
   * the score arithmetic (and mirrored by the client's optimistic
   * `applyVoteToggle`). The DB no longer applies it to a counter — the score is
   * derived — so the repository uses only `next` to pick delete-vs-upsert.
   */
  delta: number;
  /** The user's resulting vote (null = toggled off). */
  next: UserVote;
}

/**
 * Pure one-vote-per-user transition. Given the user's existing vote and the
 * direction they just pressed, return the net-tally delta and their resulting
 * vote:
 *
 * - none + up   → +1, up     · none + down → −1, down   (first vote)
 * - up   + up   → −1, null   · down + down → +1, null   (toggle off)
 * - up   + down → −2, down   · down + up   → +2, up     (switch)
 *
 * No I/O. The repository reads the existing vote, calls this, and writes ONLY
 * the ledger: `next === null` deletes the row (toggle off), otherwise it upserts
 * `next`. `events.votes` is never touched — the displayed score is derived as
 * base + ledger_sum, so it cannot drift.
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
 * Durable and multi-instance-safe. The displayed vote score is DERIVED —
 * `events.votes` (an immutable base/seed number) plus the signed sum of the
 * `event_votes` ledger — so voting mutates only the ledger and the score can
 * never drift out of sync with who voted. The ledger also deduplicates and
 * toggles per-user votes. This is the store used on Vercel and (via a Neon dev
 * branch) locally when DATABASE_URL is set.
 */
export class DrizzleEventsRepository implements EventsRepository {
  async list(userId?: string): Promise<AtlasEvent[]> {
    const sql = getSql();
    if (userId) {
      // Derived score: immutable base (e.votes) + the ledger's signed sum. A
      // correlated subquery totals every ledger row for the event; a separate
      // LEFT JOIN pulls just the caller's own row for `user_vote`.
      const rows = (await sql`
        SELECT e.id, e.title, e.description, e.layer_ids,
               ST_Y(e.geom::geometry) AS lat, ST_X(e.geom::geometry) AS lng,
               e.year,
               e.votes + COALESCE((
                 SELECT SUM(CASE ev.direction WHEN 'up' THEN 1 ELSE -1 END)
                 FROM event_votes ev WHERE ev.event_id = e.id
               ), 0) AS votes,
               e.created_by, e.created_at,
               uv.direction AS user_vote
        FROM events e
        LEFT JOIN event_votes uv
          ON uv.event_id = e.id AND uv.user_id = ${userId}
        ORDER BY e.created_at DESC
      `) as EventRow[];
      return rows.map(mapRow);
    }
    const rows = (await sql`
      SELECT e.id, e.title, e.description, e.layer_ids,
             ST_Y(e.geom::geometry) AS lat, ST_X(e.geom::geometry) AS lng,
             e.year,
             e.votes + COALESCE((
               SELECT SUM(CASE ev.direction WHEN 'up' THEN 1 ELSE -1 END)
               FROM event_votes ev WHERE ev.event_id = e.id
             ), 0) AS votes,
             e.created_by, e.created_at,
             NULL AS user_vote
      FROM events e
      ORDER BY e.created_at DESC
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

    // The score is DERIVED (base + ledger_sum), so it cannot drift: this method
    // mutates ONLY the `event_votes` ledger, never `events.votes`. neon-http has
    // no multi-statement transaction, but that's fine here because there is only
    // one write and it is idempotent under a race.
    //
    // Verify the event exists first — the ledger's FK to events.id would raise on
    // an upsert for an unknown id, and an unknown id must return null, not error.
    const eventRows = (await sql`
      SELECT id FROM events WHERE id = ${id}
    `) as { id: string }[];
    if (!eventRows[0]) return null;

    // Read the caller's current ledger row and decide the mutation purely: same
    // direction → toggle the vote off (delete); otherwise upsert it.
    const existingRows = (await sql`
      SELECT direction FROM event_votes
      WHERE event_id = ${id} AND user_id = ${uid}
    `) as { direction: VoteDirection }[];
    const existing = existingRows[0]?.direction ?? null;
    const { next } = voteTransition(existing, direction);

    if (next === null) {
      await sql`
        DELETE FROM event_votes
        WHERE event_id = ${id} AND user_id = ${uid}
      `;
    } else {
      // Idempotent upsert: two concurrent same-user INSERTs collapse to one row
      // via the composite PK instead of the second raising a duplicate-key 500.
      await sql`
        INSERT INTO event_votes (event_id, user_id, direction)
        VALUES (${id}, ${uid}, ${next})
        ON CONFLICT (event_id, user_id)
        DO UPDATE SET direction = EXCLUDED.direction, created_at = now()
      `;
    }

    // Re-read the event with the same derived-score select as `list`, scoped to
    // this user so `user_vote` reflects the ledger we just wrote.
    const rows = (await sql`
      SELECT e.id, e.title, e.description, e.layer_ids,
             ST_Y(e.geom::geometry) AS lat, ST_X(e.geom::geometry) AS lng,
             e.year,
             e.votes + COALESCE((
               SELECT SUM(CASE ev.direction WHEN 'up' THEN 1 ELSE -1 END)
               FROM event_votes ev WHERE ev.event_id = e.id
             ), 0) AS votes,
             e.created_by, e.created_at,
             uv.direction AS user_vote
      FROM events e
      LEFT JOIN event_votes uv
        ON uv.event_id = e.id AND uv.user_id = ${uid}
      WHERE e.id = ${id}
    `) as EventRow[];
    const row = rows[0];
    if (!row) return null;
    return mapRow(row);
  }
}
