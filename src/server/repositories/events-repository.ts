import type { AtlasEvent, NewEventInput, VoteDirection } from "@/types/event";

/**
 * The events persistence seam.
 *
 * Every consumer (route handlers) depends on this interface, never on a concrete
 * store. Phase 1 backs it with a JSON file; Phase 2 swaps in PostGIS with
 * server-side spatial/bbox queries — a drop-in replacement because the contract
 * is I/O-shaped (Promise-returning) and store-agnostic.
 */
export interface EventsRepository {
  /** All events. Viewport/admin filtering is done client-side in Phase 1. */
  list(): Promise<AtlasEvent[]>;
  /** Create an event; the store assigns id, votes (0), and createdAt. */
  add(input: NewEventInput): Promise<AtlasEvent>;
  /** Apply a vote; returns the updated event, or null if the id is unknown. */
  vote(id: string, direction: VoteDirection): Promise<AtlasEvent | null>;
}
