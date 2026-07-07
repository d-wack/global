import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Neon's stateless HTTP driver — ideal for serverless (Vercel). Both clients are
 * lazily created so importing this module never requires DATABASE_URL (the
 * file-store fallback path must still load without a database).
 */
type Db = ReturnType<typeof drizzle<typeof schema>>;

let db: Db | undefined;
let sqlClient: NeonQueryFunction<false, false> | undefined;

function requireUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

/** Drizzle client (schema-typed) — used by migrations/studio and typed queries. */
export function getDb(): Db {
  db ??= drizzle(neon(requireUrl()), { schema });
  return db;
}

/**
 * Raw Neon tagged-template client. The events repository uses this for the
 * PostGIS SQL (ST_X/ST_Y/ST_MakePoint) — explicit and driver-shape-predictable
 * (returns an array of row objects).
 */
export function getSql(): NeonQueryFunction<false, false> {
  sqlClient ??= neon(requireUrl());
  return sqlClient;
}
