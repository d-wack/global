/**
 * Core domain model for Planet Atlas.
 *
 * An {@link AtlasEvent} is a single point on the map — news, an event, or a
 * historical entry. This is the entity the repository, importance function, and
 * viewport filter all operate on. Later phases add importance score, admin tags,
 * provenance, and moderation status; keep those additive.
 */

export type VoteDirection = "up" | "down";

export interface AtlasEvent {
  id: string;
  title: string;
  description: string;
  /** Layers this event belongs to (many-to-many). At least one; see config/layers.ts. */
  layerIds: string[];
  /** Longitude, decimal degrees, -180..180. */
  lng: number;
  /** Latitude, decimal degrees, -90..90. */
  lat: number;
  /** Net community score (up minus down). May be negative. */
  votes: number;
  /** The year the event occurred (negative = BCE). Powers the timeline. */
  year: number;
  /** ISO-8601 timestamp of creation (record time; drives importance recency). */
  createdAt: string;
  /**
   * Auth0 `sub` of the user who created the event, or null for anonymous /
   * legacy rows. Attribution only; never trusted for authorization.
   */
  createdBy?: string | null;
  /**
   * The requesting user's own vote on this event (`"up"`/`"down"`), or null when
   * they haven't voted or the request is anonymous. Powers one-vote-per-user
   * toggling in the UI. Derived per-request; not stored on the event itself.
   */
  userVote?: VoteDirection | null;
}

/** The fields a client supplies when adding an event; the server assigns the rest. */
export type NewEventInput = Pick<
  AtlasEvent,
  "title" | "description" | "layerIds" | "lng" | "lat" | "year"
>;
