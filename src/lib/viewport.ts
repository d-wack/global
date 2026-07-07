import type { AtlasEvent } from "@/types/event";

/**
 * Client-side viewport + list filtering — the spatial-query seam.
 *
 * Pure functions so the panel's ranking/filtering is testable without React or a
 * map. Phase 2 replaces {@link filterVisible} with a server-side PostGIS bbox
 * query; the layer/text filters stay client-side (see src/lib/layers.ts).
 */

export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

/** Whether an event's point falls inside the bounds (handles antimeridian wrap). */
export function isInBounds(event: AtlasEvent, bounds: Bounds): boolean {
  const inLat = event.lat >= bounds.south && event.lat <= bounds.north;
  const inLng =
    bounds.west <= bounds.east
      ? event.lng >= bounds.west && event.lng <= bounds.east
      : // Bounds cross the antimeridian (west > east).
        event.lng >= bounds.west || event.lng <= bounds.east;
  return inLat && inLng;
}

export function filterVisible(
  events: readonly AtlasEvent[],
  bounds: Bounds,
): AtlasEvent[] {
  return events.filter((event) => isInBounds(event, bounds));
}

/** Case-insensitive substring match on title or description; blank shows all. */
export function searchFilter(
  events: readonly AtlasEvent[],
  query: string,
): AtlasEvent[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...events];
  return events.filter(
    (event) =>
      event.title.toLowerCase().includes(q) ||
      event.description.toLowerCase().includes(q),
  );
}
