import { describe, expect, it } from "vitest";

import {
  filterAsOf,
  formatYear,
  fractionToYear,
  TIMELINE_MIN_YEAR,
  yearParts,
  yearToFraction,
} from "@/lib/timeline";
import type { AtlasEvent } from "@/types/event";

const MAX = 2026;

function evt(year: number, id = String(year)): AtlasEvent {
  return {
    id,
    title: id,
    description: "",
    layerIds: ["historical"],
    lng: 0,
    lat: 0,
    votes: 0,
    year,
    createdAt: "2026-07-06T00:00:00.000Z",
  };
}

describe("yearToFraction", () => {
  it("maps the endpoints to 0 and 1", () => {
    expect(yearToFraction(TIMELINE_MIN_YEAR, MAX)).toBeCloseTo(0, 6);
    expect(yearToFraction(MAX, MAX)).toBeCloseTo(1, 6);
  });

  it("is strictly increasing in year", () => {
    const years = [-3000, -2000, -500, 0, 1000, 1800, 2000, 2026];
    const fracs = years.map((y) => yearToFraction(y, MAX));
    for (let i = 1; i < fracs.length; i++) {
      expect(fracs[i]!).toBeGreaterThan(fracs[i - 1]!);
    }
  });

  it("gives recent years more track width than ancient ones (era-compressed)", () => {
    const recent = yearToFraction(2026, MAX) - yearToFraction(1926, MAX);
    const ancient = yearToFraction(-900, MAX) - yearToFraction(-1000, MAX);
    expect(recent).toBeGreaterThan(ancient);
  });

  it("clamps years beyond the range", () => {
    expect(yearToFraction(-9999, MAX)).toBe(0);
  });
});

describe("fractionToYear", () => {
  it("round-trips with yearToFraction", () => {
    for (const y of [-3000, -1500, -50, 0, 476, 1492, 1969, 2026]) {
      expect(fractionToYear(yearToFraction(y, MAX), MAX)).toBe(y);
    }
  });

  it("clamps fractions outside [0,1]", () => {
    expect(fractionToYear(-1, MAX)).toBe(TIMELINE_MIN_YEAR);
    expect(fractionToYear(2, MAX)).toBe(MAX);
  });
});

describe("formatYear", () => {
  it("labels CE, BCE, and year zero", () => {
    expect(formatYear(2026)).toBe("2026 CE");
    expect(formatYear(-2560)).toBe("2560 BCE");
    expect(formatYear(0)).toBe("1 BCE");
  });
});

describe("yearParts", () => {
  it("splits magnitude and era for CE, BCE, and year zero", () => {
    expect(yearParts(2026)).toEqual({ magnitude: 2026, era: "CE" });
    expect(yearParts(-2560)).toEqual({ magnitude: 2560, era: "BCE" });
    expect(yearParts(0)).toEqual({ magnitude: 1, era: "BCE" });
  });
});

describe("filterAsOf", () => {
  it("keeps only events in or before the selected year", () => {
    const events = [evt(-2560), evt(-50), evt(2026)];
    expect(filterAsOf(events, 1500).map((e) => e.id)).toEqual(["-2560", "-50"]);
    expect(filterAsOf(events, 2026)).toHaveLength(3);
    expect(filterAsOf(events, -3000)).toHaveLength(0);
  });
});
