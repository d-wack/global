import { afterEach, describe, expect, it, vi } from "vitest";

import { NominatimGeocoder } from "@/server/geocode/nominatim-geocoder";

const sampleResponse = [
  {
    display_name: "Tbilisi, Georgia",
    lat: "41.6934",
    lon: "44.8015",
    boundingbox: ["41.6", "41.8", "44.7", "44.9"],
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NominatimGeocoder", () => {
  it("maps results and reorders the bbox to [west, south, east, north]", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await new NominatimGeocoder().search("Tbilisi");

    expect(results).toEqual([
      {
        name: "Tbilisi, Georgia",
        lng: 44.8015,
        lat: 41.6934,
        bbox: [44.7, 41.6, 44.9, 41.8],
      },
    ]);
  });

  it("sends the query and an identifying User-Agent", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);

    await new NominatimGeocoder().search("Reykjavik");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.searchParams.get("q")).toBe("Reykjavik");
    expect((init.headers as Record<string, string>)["User-Agent"]).toBeTruthy();
  });

  it("throws when Nominatim responds with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429 }),
    );
    await expect(new NominatimGeocoder().search("x")).rejects.toThrow();
  });
});
