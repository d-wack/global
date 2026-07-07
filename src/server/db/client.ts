import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Drizzle client over Neon's stateless HTTP driver — ideal for serverless
 * (Vercel). Lazily created so importing this module never requires DATABASE_URL
 * (the file-store fallback path must still load).
 */
type Db = ReturnType<typeof drizzle<typeof schema>>;

let db: Db | undefined;

export function getDb(): Db {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    db = drizzle(neon(url), { schema });
  }
  return db;
}
