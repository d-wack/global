import type { EventsRepository } from "./events-repository";
import { FileEventsRepository } from "./file-events-repository";

/**
 * The single place that chooses a concrete {@link EventsRepository}. Swap the
 * implementation here (e.g. a PostgisEventsRepository) without touching any
 * route handler. Cached as a process singleton so the file store's write queue
 * is shared across requests.
 */
let instance: EventsRepository | undefined;

export function getEventsRepository(): EventsRepository {
  instance ??= new FileEventsRepository();
  return instance;
}

export type { EventsRepository } from "./events-repository";
