import { describe, expect, it } from "vitest";

import {
  geocodeQuerySchema,
  newEventSchema,
  parseJsonBody,
  validate,
  voteSchema,
} from "@/lib/schemas";

const validEvent = {
  title: "A new event",
  description: "Something happened here",
  category: "news",
  lng: 12.5,
  lat: 41.9,
};

describe("newEventSchema", () => {
  it("accepts a valid event", () => {
    expect(newEventSchema.safeParse(validEvent).success).toBe(true);
  });

  it("defaults a missing description to an empty string", () => {
    const { title, category, lng, lat } = validEvent;
    const result = newEventSchema.safeParse({ title, category, lng, lat });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBe("");
  });

  it("rejects an empty title", () => {
    expect(
      newEventSchema.safeParse({ ...validEvent, title: "  " }).success,
    ).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(
      newEventSchema.safeParse({ ...validEvent, category: "rumor" }).success,
    ).toBe(false);
  });

  it("rejects out-of-range coordinates", () => {
    expect(newEventSchema.safeParse({ ...validEvent, lng: 200 }).success).toBe(
      false,
    );
    expect(newEventSchema.safeParse({ ...validEvent, lat: -91 }).success).toBe(
      false,
    );
  });

  it("rejects a non-numeric coordinate", () => {
    expect(
      newEventSchema.safeParse({ ...validEvent, lng: "east" }).success,
    ).toBe(false);
  });
});

describe("voteSchema", () => {
  it("accepts up and down", () => {
    expect(voteSchema.safeParse({ direction: "up" }).success).toBe(true);
    expect(voteSchema.safeParse({ direction: "down" }).success).toBe(true);
  });

  it("rejects anything else", () => {
    expect(voteSchema.safeParse({ direction: "sideways" }).success).toBe(false);
  });
});

describe("geocodeQuerySchema", () => {
  it("rejects an empty query", () => {
    expect(geocodeQuerySchema.safeParse({ q: "" }).success).toBe(false);
  });
});

describe("validate", () => {
  it("returns ok with parsed data on success", () => {
    const result = validate(voteSchema, { direction: "up" });
    expect(result).toEqual({ ok: true, data: { direction: "up" } });
  });

  it("returns a joined error message on failure", () => {
    const result = validate(newEventSchema, { ...validEvent, title: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });
});

describe("parseJsonBody", () => {
  it("validates a JSON request body", async () => {
    const request = new Request("http://test/api", {
      method: "POST",
      body: JSON.stringify(validEvent),
    });
    const result = await parseJsonBody(request, newEventSchema);
    expect(result.ok).toBe(true);
  });

  it("fails cleanly on malformed JSON", async () => {
    const request = new Request("http://test/api", {
      method: "POST",
      body: "{not json",
    });
    const result = await parseJsonBody(request, newEventSchema);
    expect(result).toEqual({ ok: false, error: "Invalid JSON body" });
  });
});
