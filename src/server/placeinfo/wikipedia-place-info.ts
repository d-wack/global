import {
  PLACEINFO_LIMIT,
  PLACEINFO_RADIUS_M,
  PLACEINFO_THUMB_SIZE,
  WIKIPEDIA_API_URL,
  WIKIPEDIA_USER_AGENT,
} from "@/config/placeinfo";

import type { PlaceInfoProvider, PlaceInfoResult } from "./place-info-provider";

/**
 * Wikipedia (MediaWiki API) place-info provider. Two requests: GeoSearch for
 * nearby pages (already distance-sorted), then a batch enrich by pageids for
 * extract/description/thumbnail/url. Results preserve GeoSearch distance order.
 * Keyless, but sends an identifying User-Agent (Wikimedia policy).
 */

interface GeoSearchItem {
  pageid: number;
  title: string;
  lat: number;
  lon: number;
  dist: number;
}

interface PageItem {
  pageid: number;
  title: string;
  extract?: string;
  description?: string;
  thumbnail?: { source: string };
  canonicalurl?: string;
}

const HEADERS = { "User-Agent": WIKIPEDIA_USER_AGENT };

export class WikipediaPlaceInfo implements PlaceInfoProvider {
  async nearby(lat: number, lng: number): Promise<PlaceInfoResult[]> {
    const geo = await this.geosearch(lat, lng);
    if (geo.length === 0) return [];

    const pages = await this.enrich(geo.map((g) => g.pageid));

    return geo.map((g) => {
      const page = pages.get(g.pageid);
      const result: PlaceInfoResult = {
        pageId: g.pageid,
        title: g.title,
        distanceMeters: Math.round(g.dist),
        lat: g.lat,
        lng: g.lon,
        url:
          page?.canonicalurl ?? `https://en.wikipedia.org/?curid=${g.pageid}`,
      };
      if (page?.description) result.description = page.description;
      if (page?.extract) result.extract = page.extract;
      if (page?.thumbnail?.source) result.thumbnailUrl = page.thumbnail.source;
      return result;
    });
  }

  private async geosearch(lat: number, lng: number): Promise<GeoSearchItem[]> {
    const url = new URL(WIKIPEDIA_API_URL);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("formatversion", "2");
    url.searchParams.set("list", "geosearch");
    url.searchParams.set("gscoord", `${lat}|${lng}`);
    url.searchParams.set("gsradius", String(PLACEINFO_RADIUS_M));
    url.searchParams.set("gslimit", String(PLACEINFO_LIMIT));

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Wikipedia geosearch failed: ${res.status}`);
    const json = (await res.json()) as {
      query?: { geosearch?: GeoSearchItem[] };
    };
    return json.query?.geosearch ?? [];
  }

  private async enrich(pageIds: number[]): Promise<Map<number, PageItem>> {
    const url = new URL(WIKIPEDIA_API_URL);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("formatversion", "2");
    url.searchParams.set("pageids", pageIds.join("|"));
    url.searchParams.set("prop", "extracts|pageimages|info|description");
    url.searchParams.set("exintro", "1");
    url.searchParams.set("explaintext", "1");
    url.searchParams.set("exlimit", "max");
    url.searchParams.set("piprop", "thumbnail");
    url.searchParams.set("pithumbsize", String(PLACEINFO_THUMB_SIZE));
    url.searchParams.set("pilimit", "max");
    url.searchParams.set("inprop", "url");

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Wikipedia enrich failed: ${res.status}`);
    const json = (await res.json()) as { query?: { pages?: PageItem[] } };

    const byId = new Map<number, PageItem>();
    for (const page of json.query?.pages ?? []) byId.set(page.pageid, page);
    return byId;
  }
}
