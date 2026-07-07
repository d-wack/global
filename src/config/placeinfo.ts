/**
 * Wikipedia place-info configuration — the "what's here" provider seam.
 *
 * Uses the keyless MediaWiki API. Wikimedia's policy requires an identifying
 * User-Agent; calls are made server-side (see src/server/placeinfo) so this is
 * centralized and a cached/keyed source can swap in later without touching the
 * client.
 */

export const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";

export const WIKIPEDIA_USER_AGENT =
  process.env.WIKIPEDIA_USER_AGENT ??
  "PlanetAtlas/0.1 (https://github.com/d-wack/global)";

/** GeoSearch radius in meters (10..10000). */
export const PLACEINFO_RADIUS_M = 10000;

/** Max nearby articles returned. */
export const PLACEINFO_LIMIT = 10;

/** Thumbnail width in pixels requested per article. */
export const PLACEINFO_THUMB_SIZE = 200;
