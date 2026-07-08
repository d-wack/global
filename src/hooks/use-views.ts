"use client";

import { useCallback, useEffect, useState } from "react";

import type { UserView } from "@/types/view";

export interface UseViews {
  views: UserView[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches the caller's recent settled views from `GET /api/views` (newest
 * first) for "places I've visited". Mirrors {@link import("./use-events").useEvents}'s
 * fetch shape. In open mode the endpoint returns an empty list, so the history
 * is simply empty — never an error.
 */
export function useViews(): UseViews {
  const [views, setViews] = useState<UserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/views");
      if (!res.ok) throw new Error("Failed to load views");
      const json = (await res.json()) as { views: UserView[] };
      setViews(json.views);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load views");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load once on mount — the intended "sync React with an external system" use.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  return { views, loading, error, refetch };
}
