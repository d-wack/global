import { describe, expect, it } from "vitest";

import type { AtlasEvent, EventCategory } from "@/types/event";
import {
  applyCategoryFilter,
  filterVisible,
  isInBounds,
  searchFilter,
  type Bounds,
} from "@/lib/viewport";

function evt(overrides: Partial<AtlasEvent> = {}): AtlasEvent {
  return {
    id: "e",
    title: "Title",
    description: "Description",
    category: "news",
    lng: 0,
    lat: 0,
    votes: 0,
    createdAt: "2026-07-06T00:00:00.000Z",
    ...overrides,
  };
}

const world: Bounds = { west: -10, south: -10, east: 10, north: 10 };

describe("isInBounds", () => {
  it("includes a point inside the box", () => {
    expect(isInBounds(evt({ lng: 5, lat: 5 }), world)).toBe(true);
  });

  it("excludes a point outside the box", () => {
    expect(isInBounds(evt({ lng: 50, lat: 5 }), world)).toBe(false);
    expect(isInBounds(evt({ lng: 5, lat: 50 }), world)).toBe(false);
  });

  it("handles bounds that cross the antimeridian", () => {
    const wrap: Bounds = { west: 170, south: -10, east: -170, north: 10 };
    expect(isInBounds(evt({ lng: 175, lat: 0 }), wrap)).toBe(true);
    expect(isInBounds(evt({ lng: -175, lat: 0 }), wrap)).toBe(true);
    expect(isInBounds(evt({ lng: 0, lat: 0 }), wrap)).toBe(false);
  });
});

describe("filterVisible", () => {
  it("keeps only in-bounds events", () => {
    const events = [evt({ id: "in", lng: 1 }), evt({ id: "out", lng: 100 })];
    expect(filterVisible(events, world).map((e) => e.id)).toEqual(["in"]);
  });
});

describe("applyCategoryFilter", () => {
  it("keeps events in the active set", () => {
    const events = [
      evt({ id: "n", category: "news" }),
      evt({ id: "e", category: "event" }),
      evt({ id: "h", category: "historical" }),
    ];
    const active = new Set<EventCategory>(["news", "historical"]);
    expect(applyCategoryFilter(events, active).map((e) => e.id)).toEqual([
      "n",
      "h",
    ]);
  });

  it("returns nothing for an empty active set", () => {
    expect(applyCategoryFilter([evt()], new Set()).length).toBe(0);
  });
});

describe("searchFilter", () => {
  const events = [
    evt({ id: "a", title: "Maglev opens", description: "trains" }),
    evt({ id: "b", title: "Festival", description: "concerts and light" }),
  ];

  it("matches title or description, case-insensitively", () => {
    expect(searchFilter(events, "MAGLEV").map((e) => e.id)).toEqual(["a"]);
    expect(searchFilter(events, "light").map((e) => e.id)).toEqual(["b"]);
  });

  it("returns all events for a blank query", () => {
    expect(searchFilter(events, "   ").length).toBe(2);
  });
});
