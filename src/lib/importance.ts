import type { AtlasEvent } from "@/types/event";

/**
 * Importance ranking — the "secret sauce" seam.
 *
 * Pure and isolated: no I/O, no ambient clock (callers inject `now`). Today it
 * blends community votes with a recency decay. Later phases add feed
 * significance (GDELT mention/coverage counts) and spatial relevance as extra
 * additive terms here; callers (the panel) never change.
 *
 * Keeping `now` a parameter makes ranking deterministic and unit-testable, and
 * lets the client recompute against the current time on every render.
 */

/** Hours after which the recency bonus halves. ~3 days. */
export const RECENCY_HALF_LIFE_HOURS = 72;

/** Weight of a brand-new event's recency bonus, in vote-equivalents. */
export const RECENCY_WEIGHT = 6;

const MS_PER_HOUR = 1000 * 60 * 60;

/**
 * Score an event. Higher is more important. `now` is epoch milliseconds
 * (e.g. `Date.now()`), injected so the function stays pure.
 */
export function importance(event: AtlasEvent, now: number): number {
  const ageHours = Math.max(
    0,
    (now - Date.parse(event.createdAt)) / MS_PER_HOUR,
  );
  const recencyBonus =
    RECENCY_WEIGHT * Math.pow(0.5, ageHours / RECENCY_HALF_LIFE_HOURS);
  return event.votes + recencyBonus;
}

/**
 * Return a new array of events sorted by importance, most important first.
 * Does not mutate the input. Ties break by newer-first, then by id for
 * stability.
 */
export function rankByImportance(
  events: readonly AtlasEvent[],
  now: number,
): AtlasEvent[] {
  return [...events].sort((a, b) => {
    const diff = importance(b, now) - importance(a, now);
    if (diff !== 0) return diff;
    const timeDiff = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });
}
