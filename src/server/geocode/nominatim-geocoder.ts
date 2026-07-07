import {
  GEOCODE_RESULT_LIMIT,
  NOMINATIM_URL,
  NOMINATIM_USER_AGENT,
} from "@/config/geocode";

import type { Geocoder, GeocodeResult } from "./geocoder";

/**
 * Nominatim (OpenStreetMap) geocoder. Keyless, but the usage policy requires an
 * identifying User-Agent and discourages heavy use — hence server-side only and
 * a small result limit. Called through /api/geocode.
 */

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
  /** Nominatim order: [south, north, west, east], as strings. */
  boundingbox: [string, string, string, string];
}

export class NominatimGeocoder implements Geocoder {
  async search(query: string): Promise<GeocodeResult[]> {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", String(GEOCODE_RESULT_LIMIT));

    const response = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });
    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status}`);
    }

    const items = (await response.json()) as NominatimItem[];
    return items.map(toResult);
  }
}

function toResult(item: NominatimItem): GeocodeResult {
  const bb = item.boundingbox;
  // Reorder [south, north, west, east] -> [west, south, east, north].
  return {
    name: item.display_name,
    lng: Number(item.lon),
    lat: Number(item.lat),
    bbox: [Number(bb[2]), Number(bb[0]), Number(bb[3]), Number(bb[1])],
  };
}
