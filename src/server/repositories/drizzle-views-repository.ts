import { getSql } from "@/server/db/client";
import type { NewViewInput, UserView } from "@/types/view";

import { DEFAULT_RECENT_LIMIT, type ViewsRepository } from "./views-repository";

/** Raw row shape returned by the INSERT ... RETURNING / SELECT column list. */
export interface ViewRow {
  id: string;
  lng: number | string;
  lat: number | string;
  zoom: number | string;
  year: number | string;
  created_at: string | Date;
}

/**
 * Map a DB row to the domain {@link UserView}. Pure and coercing: the neon-http
 * driver may hand back strings for float8/int columns, so numerics are
 * normalized with Number(), and created_at is emitted as an ISO string. No
 * `user_id` is projected — it's the query key, not part of the view payload.
 */
export function mapRow(row: ViewRow): UserView {
  return {
    id: row.id,
    lng: Number(row.lng),
    lat: Number(row.lat),
    zoom: Number(row.zoom),
    year: Number(row.year),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * Postgres-backed {@link ViewsRepository} on Neon (Drizzle stack). Append-only:
 * `append` is a single INSERT ... RETURNING and `listRecent` a single indexed
 * SELECT (served by the (user_id, created_at desc) composite btree). Uses the
 * raw Neon client for explicit, driver-shape-predictable SQL — mirroring the
 * events repository. Orthogonal to `events`: no joins, no FK, no PostGIS.
 */
export class DrizzleViewsRepository implements ViewsRepository {
  async append(input: NewViewInput, userId: string): Promise<UserView> {
    const sql = getSql();
    const rows = (await sql`
      INSERT INTO user_views (user_id, lng, lat, zoom, year)
      VALUES (
        ${userId},
        ${input.lng},
        ${input.lat},
        ${input.zoom},
        ${input.year}
      )
      RETURNING id, lng, lat, zoom, year, created_at
    `) as ViewRow[];
    const row = rows[0];
    if (!row) throw new Error("insert returned no row");
    return mapRow(row);
  }

  async listRecent(
    userId: string,
    limit: number = DEFAULT_RECENT_LIMIT,
  ): Promise<UserView[]> {
    const sql = getSql();
    const rows = (await sql`
      SELECT id, lng, lat, zoom, year, created_at
      FROM user_views
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `) as ViewRow[];
    return rows.map(mapRow);
  }
}
