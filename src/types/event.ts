/**
 * Core domain model for Planet Atlas.
 *
 * An {@link AtlasEvent} is a single point on the map — news, an event, or a
 * historical entry. This is the entity the repository, importance function, and
 * viewport filter all operate on. Later phases add importance score, admin tags,
 * provenance, and moderation status; keep those additive.
 */

export const EVENT_CATEGORIES = ["news", "event", "historical"] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export type VoteDirection = "up" | "down";

export interface AtlasEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
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
}

/** The fields a client supplies when adding an event; the server assigns the rest. */
export type NewEventInput = Pick<
  AtlasEvent,
  "title" | "description" | "category" | "lng" | "lat" | "year"
>;
