/**
 * Nominatim geocoder configuration — the geocoder seam.
 *
 * Nominatim's usage policy requires a genuine identifying User-Agent and
 * discourages heavy/unthrottled use. Calls are made server-side (see
 * src/server/geocode) so this identity is centralized and a keyed / self-hosted
 * provider can be swapped in later without touching the client.
 */

export const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export const NOMINATIM_USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ??
  "PlanetAtlas/0.1 (https://github.com/d-wack/global)";

/** Max geocode results returned to the client. */
export const GEOCODE_RESULT_LIMIT = 5;
