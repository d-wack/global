/**
 * The geocoding seam. The client hits our /api/geocode route, which delegates to
 * a {@link Geocoder}; it never calls a provider directly. Swap the implementation
 * (keyed / self-hosted) later without changing callers.
 */

export interface GeocodeResult {
  /** Human-readable place name. */
  name: string;
  lng: number;
  lat: number;
  /** [west, south, east, north] — ready to pass to MapLibre's fitBounds. */
  bbox: [number, number, number, number];
}

export interface Geocoder {
  /** Resolve a free-text place query to ranked candidate locations. */
  search(query: string): Promise<GeocodeResult[]>;
}
