import { describe, expect, it } from "vitest";

import { isUuid, mapRow, type EventRow } from "./drizzle-events-repository";

describe("mapRow", () => {
  const baseRow: EventRow = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Quake",
    description: "A tremor",
    layer_ids: ["news", "event"],
    lat: 35.68,
    lng: 139.69,
    year: 2026,
    votes: 7,
    created_at: "2026-07-05T21:30:00.000Z",
  };

  it("maps columns to the AtlasEvent shape", () => {
    expect(mapRow(baseRow)).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Quake",
      description: "A tremor",
      layerIds: ["news", "event"],
      lng: 139.69,
      lat: 35.68,
      votes: 7,
      year: 2026,
      createdAt: "2026-07-05T21:30:00.000Z",
    });
  });

  it("coerces string numerics from the driver to numbers", () => {
    const event = mapRow({
      ...baseRow,
      lat: "35.68",
      lng: "139.69",
      votes: "-3",
      year: "-2560",
    });
    expect(event.lat).toBe(35.68);
    expect(event.lng).toBe(139.69);
    expect(event.votes).toBe(-3);
    expect(event.year).toBe(-2560);
  });

  it("normalizes a Date created_at to an ISO string", () => {
    const event = mapRow({
      ...baseRow,
      created_at: new Date("2026-07-05T21:30:00.000Z"),
    });
    expect(event.createdAt).toBe("2026-07-05T21:30:00.000Z");
  });
});

describe("isUuid", () => {
  it("accepts a uuid", () => {
    expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
  });

  it("rejects the old file-store slug ids and junk", () => {
    expect(isUuid("seed-tokyo-transit")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid("11111111-1111-4111-8111")).toBe(false);
  });
});
