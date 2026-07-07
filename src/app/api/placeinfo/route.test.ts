import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlaceInfoResult } from "@/server/placeinfo/place-info-provider";

const state = vi.hoisted(() => ({
  results: [] as PlaceInfoResult[],
  throwError: false,
}));

vi.mock("@/server/placeinfo", () => ({
  getPlaceInfoProvider: () => ({
    async nearby() {
      if (state.throwError) throw new Error("provider down");
      return state.results;
    },
  }),
}));

import { GET } from "@/app/api/placeinfo/route";

function get(query: string): Request {
  return new Request(`http://test/api/placeinfo${query}`);
}

beforeEach(() => {
  state.results = [
    {
      pageId: 1,
      title: "Roman Forum",
      distanceMeters: 120,
      lat: 41.89,
      lng: 12.48,
      url: "https://en.wikipedia.org/wiki/Roman_Forum",
    },
  ];
  state.throwError = false;
});

describe("GET /api/placeinfo", () => {
  it("returns nearby results for valid coordinates", async () => {
    const res = await GET(get("?lat=41.89&lng=12.48"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toHaveLength(1);
    expect(json.results[0].title).toBe("Roman Forum");
  });

  it("400s when lat/lng are missing", async () => {
    expect((await GET(get("?lat=41.89"))).status).toBe(400);
    expect((await GET(get(""))).status).toBe(400);
  });

  it("400s when coordinates are out of range", async () => {
    expect((await GET(get("?lat=200&lng=12"))).status).toBe(400);
  });

  it("502s when the provider fails", async () => {
    state.throwError = true;
    expect((await GET(get("?lat=41.89&lng=12.48"))).status).toBe(502);
  });
});
