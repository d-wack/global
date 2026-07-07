/**
 * The "place info" seam: given a coordinate, return nearby reference articles.
 * The client hits /api/placeinfo, which delegates here; it never calls Wikipedia
 * directly. Swap the implementation (cached / another source) without changing
 * callers.
 */

export interface PlaceInfoResult {
  pageId: number;
  title: string;
  /** Straight-line distance from the queried point, in meters. */
  distanceMeters: number;
  lat: number;
  lng: number;
  /** One-line summary (Wikidata short description), if any. */
  description?: string;
  /** Plain-text intro extract, if any. */
  extract?: string;
  thumbnailUrl?: string;
  /** Canonical article URL. */
  url: string;
}

export interface PlaceInfoProvider {
  /** Nearby articles for a point, ranked by ascending distance. */
  nearby(lat: number, lng: number): Promise<PlaceInfoResult[]>;
}
