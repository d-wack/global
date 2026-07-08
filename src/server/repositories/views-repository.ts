import type { NewViewInput, UserView } from "@/types/view";

/**
 * The User Context view-log persistence seam.
 *
 * Append-only and orthogonal to the events store — every consumer (route
 * handlers) depends on this interface, never on a concrete store. Phase 1 backs
 * it with a JSON file offline; with DATABASE_URL set it's Postgres (Drizzle/Neon).
 * The contract is I/O-shaped (Promise-returning) and store-agnostic so the swap
 * is a drop-in.
 */
export interface ViewsRepository {
  /**
   * Append a view for `userId` (the server-derived Auth0 `sub`). The store
   * assigns `id` and `createdAt`. `userId` is a separate argument — never part
   * of the client input — so it can't be spoofed through the request body.
   * (Open mode never reaches here: the route no-ops when there's no session.)
   */
  append(input: NewViewInput, userId: string): Promise<UserView>;
  /**
   * The user's most recent views, newest first. `limit` caps the result
   * (default 50).
   */
  listRecent(userId: string, limit?: number): Promise<UserView[]>;
}

/** Default page size for {@link ViewsRepository.listRecent}. */
export const DEFAULT_RECENT_LIMIT = 50;
