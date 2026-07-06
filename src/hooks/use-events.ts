"use client";

import { useCallback, useEffect, useState } from "react";

import type { AtlasEvent, NewEventInput, VoteDirection } from "@/types/event";

const JSON_HEADERS = { "Content-Type": "application/json" };

export interface UseEvents {
  events: AtlasEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addEvent: (input: NewEventInput) => Promise<AtlasEvent | null>;
  voteEvent: (id: string, direction: VoteDirection) => Promise<void>;
}

/**
 * Fetches events from /api/events and owns the client copy. Adds are appended on
 * success; votes are applied optimistically and rolled back if the request fails.
 */
export function useEvents(): UseEvents {
  const [events, setEvents] = useState<AtlasEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to load events");
      const json = (await res.json()) as { events: AtlasEvent[] };
      setEvents(json.events);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load once on mount. refetch() flips loading state; this is the intended
    // "sync React with an external system" use of an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  const addEvent = useCallback(async (input: NewEventInput) => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const { event } = (await res.json()) as { event: AtlasEvent };
    setEvents((prev) => [...prev, event]);
    return event;
  }, []);

  const voteEvent = useCallback(
    async (id: string, direction: VoteDirection) => {
      const delta = direction === "up" ? 1 : -1;
      const apply = (d: number) =>
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, votes: e.votes + d } : e)),
        );

      apply(delta); // optimistic
      try {
        const res = await fetch(`/api/events/${id}/vote`, {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ direction }),
        });
        if (!res.ok) throw new Error("vote failed");
        const { event } = (await res.json()) as { event: AtlasEvent };
        setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
      } catch {
        apply(-delta); // roll back
      }
    },
    [],
  );

  return { events, loading, error, refetch, addEvent, voteEvent };
}
