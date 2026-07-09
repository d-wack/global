/**
 * User Context view-log model for Planet Atlas.
 *
 * A {@link UserView} is one append-only telemetry row: a snapshot of where a
 * user was looking (map center + zoom) and at which timeline year. It is
 * deliberately ORTHOGONAL to {@link import("./event").AtlasEvent} — no foreign
 * key, no coupling to the event model — so the view log stays lite and can be
 * swapped/queried independently. Plain lng/lat columns (not PostGIS): this is
 * telemetry, not a spatial query surface yet.
 */

export interface UserView {
  id: string;
  /** Longitude of the map center, decimal degrees, -180..180. */
  lng: number;
  /** Latitude of the map center, decimal degrees, -90..90. */
  lat: number;
  /** Map zoom level at capture time. */
  zoom: number;
  /** The timeline year in view (negative = BCE). */
  year: number;
  /** ISO-8601 timestamp the view was recorded. */
  createdAt: string;
}

/**
 * The fields a client supplies when logging a view. `userId` is NEVER part of
 * the input — it is derived server-side from the session; the store assigns
 * `id` and `createdAt`.
 */
export type NewViewInput = {
  lng: number;
  lat: number;
  zoom: number;
  year: number;
};
