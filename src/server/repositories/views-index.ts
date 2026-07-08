import { DrizzleViewsRepository } from "./drizzle-views-repository";
import { FileViewsRepository } from "./file-views-repository";
import type { ViewsRepository } from "./views-repository";

/**
 * The single place that chooses a concrete {@link ViewsRepository}, without
 * touching any route handler. When DATABASE_URL is set (all Vercel envs, and
 * locally against a Neon dev branch) we use Postgres; otherwise we fall back to
 * the file store for offline, UI-only local work. Cached as a process singleton,
 * mirroring `getEventsRepository()`.
 */
let instance: ViewsRepository | undefined;

export function getViewsRepository(): ViewsRepository {
  instance ??= process.env.DATABASE_URL
    ? new DrizzleViewsRepository()
    : new FileViewsRepository();
  return instance;
}

export type { ViewsRepository } from "./views-repository";
