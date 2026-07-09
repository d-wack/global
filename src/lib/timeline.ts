import type { AtlasEvent } from "@/types/event";

/**
 * Timeline scale + as-of filtering — pure, so the scrubber math is testable
 * without the DOM.
 *
 * The scale is **era-compressed**: position is a log function of an event's
 * *age* (years before `maxYear`), so recent years occupy most of the track while
 * deep history is squeezed to the left. This keeps both 2560 BCE and this year
 * usable on one bar. `maxYear` is injected (the current year) to stay pure.
 */

/** Oldest year the scrubber can reach. */
export const TIMELINE_MIN_YEAR = -3000;

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Map a year to a track fraction in [0, 1] (0 = TIMELINE_MIN_YEAR, 1 = maxYear). */
export function yearToFraction(year: number, maxYear: number): number {
  const span = Math.log1p(maxYear - TIMELINE_MIN_YEAR);
  const age = Math.max(0, maxYear - year);
  return clamp01(1 - Math.log1p(age) / span);
}

/** Inverse of {@link yearToFraction}: a track fraction back to an integer year. */
export function fractionToYear(fraction: number, maxYear: number): number {
  const span = Math.log1p(maxYear - TIMELINE_MIN_YEAR);
  const age = Math.expm1((1 - clamp01(fraction)) * span);
  return Math.round(maxYear - age);
}

/** Human label for a year: "2026 CE", "2560 BCE", "1 BCE" for year 0. */
export function formatYear(year: number): string {
  if (year > 0) return `${year} CE`;
  if (year < 0) return `${-year} BCE`;
  return "1 BCE";
}

/** Era tag + magnitude, for readouts that split the two visually. */
export function yearParts(year: number): {
  magnitude: number;
  era: "CE" | "BCE";
} {
  if (year > 0) return { magnitude: year, era: "CE" };
  if (year < 0) return { magnitude: -year, era: "BCE" };
  return { magnitude: 1, era: "BCE" };
}

/** As-of filter: events that occurred in or before the selected year. */
export function filterAsOf(
  events: readonly AtlasEvent[],
  year: number,
): AtlasEvent[] {
  return events.filter((event) => event.year <= year);
}
