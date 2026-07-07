import { describe, expect, it } from "vitest";

import type { AtlasEvent } from "@/types/event";
import {
  importance,
  RECENCY_HALF_LIFE_HOURS,
  RECENCY_WEIGHT,
  rankByImportance,
} from "@/lib/importance";

const NOW = Date.parse("2026-07-06T00:00:00.000Z");
const HOUR = 1000 * 60 * 60;

function makeEvent(overrides: Partial<AtlasEvent> = {}): AtlasEvent {
  return {
    id: "e1",
    title: "Test",
    description: "",
    layerIds: ["news"],
    lng: 0,
    lat: 0,
    votes: 0,
    year: 2026,
    createdAt: new Date(NOW).toISOString(),
    ...overrides,
  };
}

describe("importance", () => {
  it("is pure: same inputs give same output", () => {
    const e = makeEvent({ votes: 3 });
    expect(importance(e, NOW)).toBe(importance(e, NOW));
  });

  it("gives a fresh event close to the full recency bonus", () => {
    const fresh = makeEvent({
      votes: 0,
      createdAt: new Date(NOW).toISOString(),
    });
    expect(importance(fresh, NOW)).toBeCloseTo(RECENCY_WEIGHT, 5);
  });

  it("halves the recency bonus after one half-life", () => {
    const aged = makeEvent({
      votes: 0,
      createdAt: new Date(NOW - RECENCY_HALF_LIFE_HOURS * HOUR).toISOString(),
    });
    expect(importance(aged, NOW)).toBeCloseTo(RECENCY_WEIGHT / 2, 5);
  });

  it("decays monotonically as an event ages", () => {
    const ages = [0, 12, 48, 200, 1000];
    const scores = ages.map((h) =>
      importance(
        makeEvent({ createdAt: new Date(NOW - h * HOUR).toISOString() }),
        NOW,
      ),
    );
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]!).toBeLessThan(scores[i - 1]!);
    }
  });

  it("lets votes dominate at equal recency", () => {
    const created = new Date(NOW - 10 * HOUR).toISOString();
    const popular = makeEvent({ votes: 50, createdAt: created });
    const quiet = makeEvent({ votes: 1, createdAt: created });
    expect(importance(popular, NOW)).toBeGreaterThan(importance(quiet, NOW));
  });

  it("ranks a newer event above an older one at equal votes", () => {
    const newer = makeEvent({
      votes: 5,
      createdAt: new Date(NOW - HOUR).toISOString(),
    });
    const older = makeEvent({
      votes: 5,
      createdAt: new Date(NOW - 500 * HOUR).toISOString(),
    });
    expect(importance(newer, NOW)).toBeGreaterThan(importance(older, NOW));
  });

  it("does not boost a future-dated event above a brand-new one", () => {
    const future = makeEvent({
      createdAt: new Date(NOW + 100 * HOUR).toISOString(),
    });
    expect(importance(future, NOW)).toBeCloseTo(RECENCY_WEIGHT, 5);
  });
});

describe("rankByImportance", () => {
  it("returns a new array sorted most-important-first without mutating input", () => {
    const events = [
      makeEvent({ id: "a", votes: 1 }),
      makeEvent({ id: "b", votes: 100 }),
      makeEvent({ id: "c", votes: 10 }),
    ];
    const ranked = rankByImportance(events, NOW);
    expect(ranked.map((e) => e.id)).toEqual(["b", "c", "a"]);
    expect(events.map((e) => e.id)).toEqual(["a", "b", "c"]);
    expect(ranked).not.toBe(events);
  });

  it("breaks exact ties deterministically by id", () => {
    const created = new Date(NOW).toISOString();
    const events = [
      makeEvent({ id: "z", votes: 5, createdAt: created }),
      makeEvent({ id: "a", votes: 5, createdAt: created }),
    ];
    expect(rankByImportance(events, NOW).map((e) => e.id)).toEqual(["a", "z"]);
  });
});
