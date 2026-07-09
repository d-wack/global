import { describe, expect, it } from "vitest";

import { mapRow, type ViewRow } from "./drizzle-views-repository";

describe("mapRow (views)", () => {
  const baseRow: ViewRow = {
    id: "22222222-2222-4222-8222-222222222222",
    lng: 139.69,
    lat: 35.68,
    zoom: 6.5,
    year: 2026,
    created_at: "2026-07-05T21:30:00.000Z",
  };

  it("maps columns to the UserView shape", () => {
    expect(mapRow(baseRow)).toEqual({
      id: "22222222-2222-4222-8222-222222222222",
      lng: 139.69,
      lat: 35.68,
      zoom: 6.5,
      year: 2026,
      createdAt: "2026-07-05T21:30:00.000Z",
    });
  });

  it("does not leak a user_id into the public view", () => {
    expect(mapRow(baseRow)).not.toHaveProperty("userId");
    expect(mapRow(baseRow)).not.toHaveProperty("user_id");
  });

  it("coerces string numerics from the driver to numbers", () => {
    const view = mapRow({
      ...baseRow,
      lng: "-73.99",
      lat: "40.73",
      zoom: "3",
      year: "-2560",
    });
    expect(view.lng).toBe(-73.99);
    expect(view.lat).toBe(40.73);
    expect(view.zoom).toBe(3);
    expect(view.year).toBe(-2560);
  });

  it("normalizes a Date created_at to an ISO string", () => {
    const view = mapRow({
      ...baseRow,
      created_at: new Date("2026-07-05T21:30:00.000Z"),
    });
    expect(view.createdAt).toBe("2026-07-05T21:30:00.000Z");
  });
});
