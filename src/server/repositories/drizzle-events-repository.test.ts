import { describe, expect, it } from "vitest";

import {
  isUuid,
  mapRow,
  voteTransition,
  type EventRow,
} from "./drizzle-events-repository";

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
    created_by: "auth0|abc",
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
      createdBy: "auth0|abc",
      createdAt: "2026-07-05T21:30:00.000Z",
      userVote: null,
    });
  });

  it("passes through created_by null and the caller's user_vote", () => {
    const event = mapRow({ ...baseRow, created_by: null, user_vote: "down" });
    expect(event.createdBy).toBeNull();
    expect(event.userVote).toBe("down");
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

describe("voteTransition", () => {
  it("casts a first up-vote (+1) and records it", () => {
    expect(voteTransition(null, "up")).toEqual({ delta: 1, next: "up" });
  });

  it("casts a first down-vote (−1) and records it", () => {
    expect(voteTransition(null, "down")).toEqual({ delta: -1, next: "down" });
  });

  it("toggles an up-vote off (−1) when up is pressed again", () => {
    expect(voteTransition("up", "up")).toEqual({ delta: -1, next: null });
  });

  it("toggles a down-vote off (+1) when down is pressed again", () => {
    expect(voteTransition("down", "down")).toEqual({ delta: 1, next: null });
  });

  it("switches up→down (−2) and records down", () => {
    expect(voteTransition("up", "down")).toEqual({ delta: -2, next: "down" });
  });

  it("switches down→up (+2) and records up", () => {
    expect(voteTransition("down", "up")).toEqual({ delta: 2, next: "up" });
  });

  it("nets to zero over a full cast → toggle-off cycle", () => {
    // up (+1) then up again (−1) leaves the tally unchanged and no vote.
    const first = voteTransition(null, "up");
    const second = voteTransition(first.next, "up");
    expect(first.delta + second.delta).toBe(0);
    expect(second.next).toBeNull();
  });

  it("nets a single vote's worth when switching sides once", () => {
    // Starting from up (+1), switching to down (−2) lands at −1 overall: a
    // single down-vote, exactly as if the user had only ever voted down.
    const first = voteTransition(null, "up");
    const switched = voteTransition(first.next, "down");
    expect(first.delta + switched.delta).toBe(-1);
    expect(switched.next).toBe("down");
  });
});
