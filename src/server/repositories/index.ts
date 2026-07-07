import { DrizzleEventsRepository } from "./drizzle-events-repository";
import type { EventsRepository } from "./events-repository";
import { FileEventsRepository } from "./file-events-repository";

/**
 * The single place that chooses a concrete {@link EventsRepository}, without
 * touching any route handler. When DATABASE_URL is set (all Vercel envs, and
 * locally against a Neon dev branch) we use Postgres/PostGIS; otherwise we fall
 * back to the file store for offline, UI-only local work. Cached as a process
 * singleton.
 */
let instance: EventsRepository | undefined;

export function getEventsRepository(): EventsRepository {
  instance ??= process.env.DATABASE_URL
    ? new DrizzleEventsRepository()
    : new FileEventsRepository();
  return instance;
}

export type { EventsRepository } from "./events-repository";
