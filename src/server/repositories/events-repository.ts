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
  /**
   * All events. Viewport/admin filtering is done client-side in Phase 1.
   * When `userId` is given, each event's `userVote` reflects that user's own
   * vote (else null). `userId` is optional so pre-auth callers still compile.
   */
  list(userId?: string): Promise<AtlasEvent[]>;
  /**
   * Create an event; the store assigns id, votes (0), and createdAt. `userId`
   * (Auth0 `sub`) is recorded as the event's `createdBy` attribution, or null
   * when absent.
   */
  add(input: NewEventInput, userId?: string): Promise<AtlasEvent>;
  /**
   * Apply a vote for `userId` (one vote per user, toggling): a repeat vote in
   * the same direction clears it, the opposite direction switches it. Returns
   * the updated event (with new `votes` and resulting `userVote`), or null if
   * the id is unknown. Anonymous callers share the "anonymous" bucket.
   */
  vote(
    id: string,
    direction: VoteDirection,
    userId?: string,
  ): Promise<AtlasEvent | null>;
}
