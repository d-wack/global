import path from "node:path";

/**
 * Filesystem location for the file-backed events store — the writable-path seam.
 *
 * The committed seed (src/data/seed-events.json) is read-only and bundled. The
 * repository writes to ATLAS_DATA_DIR (default `<cwd>/.data`, gitignored),
 * bootstrapping from the seed on first access.
 *
 * NOTE (standalone/Docker): under `output: 'standalone'` the app runs as a
 * non-root user in a throwaway container, so the default `.data` dir is
 * ephemeral and lost on restart. That's acceptable for this local-data slice;
 * mount a volume and set ATLAS_DATA_DIR (e.g. /data) — or move to PostGIS — for
 * durable storage. This module is server-only (uses node:path / process.cwd()).
 */

export const ATLAS_DATA_DIR =
  process.env.ATLAS_DATA_DIR ?? path.join(process.cwd(), ".data");

export const EVENTS_FILE = path.join(ATLAS_DATA_DIR, "events.json");

/**
 * Writable path for the offline User Context view log. Append-only telemetry,
 * separate file from events so the two stores stay orthogonal. Same ephemerality
 * caveat as EVENTS_FILE under standalone/Docker.
 */
export const VIEWS_FILE = path.join(ATLAS_DATA_DIR, "views.json");
