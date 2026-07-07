"use client";

import { useCallback, useState } from "react";

import type { PlaceInfoResult } from "@/server/placeinfo/place-info-provider";

/** The inspect drawer's state for one clicked point. */
export interface PlaceInfoState {
  point: { lat: number; lng: number };
  loading: boolean;
  error: string | null;
  results: PlaceInfoResult[];
}

export interface UsePlaceInfo {
  /** Current inspect result, or null when the drawer is closed. */
  placeInfo: PlaceInfoState | null;
  /** Look up nearby articles for a point (click-triggered; never on mount). */
  inspectAt: (lat: number, lng: number) => Promise<void>;
  clearPlaceInfo: () => void;
}

export function usePlaceInfo(): UsePlaceInfo {
  const [placeInfo, setPlaceInfo] = useState<PlaceInfoState | null>(null);

  const inspectAt = useCallback(async (lat: number, lng: number) => {
    const point = { lat, lng };
    setPlaceInfo({ point, loading: true, error: null, results: [] });
    try {
      const res = await fetch(`/api/placeinfo?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error("lookup failed");
      const json = (await res.json()) as { results: PlaceInfoResult[] };
      setPlaceInfo({
        point,
        loading: false,
        error: null,
        results: json.results,
      });
    } catch {
      setPlaceInfo({
        point,
        loading: false,
        error: "Couldn't load places here.",
        results: [],
      });
    }
  }, []);

  const clearPlaceInfo = useCallback(() => setPlaceInfo(null), []);

  return { placeInfo, inspectAt, clearPlaceInfo };
}
