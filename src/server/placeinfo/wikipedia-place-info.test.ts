import { afterEach, describe, expect, it, vi } from "vitest";

import { WikipediaPlaceInfo } from "@/server/placeinfo/wikipedia-place-info";

const geoResponse = {
  query: {
    geosearch: [
      {
        pageid: 1,
        title: "Roman Forum",
        lat: 41.8925,
        lon: 12.4853,
        dist: 120.4,
      },
      {
        pageid: 2,
        title: "Palatine Hill",
        lat: 41.889,
        lon: 12.487,
        dist: 340.9,
      },
    ],
  },
};

// Deliberately out of distance order to prove we re-order by geosearch.
const enrichResponse = {
  query: {
    pages: [
      {
        pageid: 2,
        title: "Palatine Hill",
        description: "hill in Rome",
        extract: "The Palatine Hill is one of the seven hills of Rome.",
        thumbnail: { source: "https://img/2.jpg" },
        canonicalurl: "https://en.wikipedia.org/wiki/Palatine_Hill",
      },
      {
        pageid: 1,
        title: "Roman Forum",
        description: "archaeological site in Rome",
        extract: "The Roman Forum is a rectangular plaza in Rome.",
        thumbnail: { source: "https://img/1.jpg" },
        canonicalurl: "https://en.wikipedia.org/wiki/Roman_Forum",
      },
    ],
  },
};

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WikipediaPlaceInfo", () => {
  it("returns nearby articles in distance order with enrichment merged", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(geoResponse))
      .mockResolvedValueOnce(jsonResponse(enrichResponse));
    vi.stubGlobal("fetch", fetchMock);

    const results = await new WikipediaPlaceInfo().nearby(41.8925, 12.4853);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results.map((r) => r.title)).toEqual([
      "Roman Forum",
      "Palatine Hill",
    ]);
    expect(results[0]).toMatchObject({
      pageId: 1,
      distanceMeters: 120,
      description: "archaeological site in Rome",
      thumbnailUrl: "https://img/1.jpg",
      url: "https://en.wikipedia.org/wiki/Roman_Forum",
    });
    expect(results[0]!.extract).toContain("Roman Forum");

    // GeoSearch coords + identifying User-Agent on both calls.
    const [geoUrl, geoInit] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(geoUrl.searchParams.get("gscoord")).toBe("41.8925|12.4853");
    expect(
      (geoInit.headers as Record<string, string>)["User-Agent"],
    ).toBeTruthy();
    const [, enrichInit] = fetchMock.mock.calls[1] as [URL, RequestInit];
    expect(
      (enrichInit.headers as Record<string, string>)["User-Agent"],
    ).toBeTruthy();
  });

  it("skips the enrich call when there are no nearby pages", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ query: { geosearch: [] } }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await new WikipediaPlaceInfo().nearby(0, 0);

    expect(results).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when GeoSearch responds with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    await expect(new WikipediaPlaceInfo().nearby(1, 1)).rejects.toThrow();
  });
});
