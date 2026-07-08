"use client";

import { useMemo } from "react";

import { useAtlas } from "@/state/atlas-context";
import type { MapView } from "@/state/atlas-context";

/**
 * Where and when the user is looking: `{ lng, lat, zoom, year }`. The single
 * "what should I display" input (Concept #1 — User Context). `lng/lat/zoom`
 * come from the live viewport; `year` from the timeline.
 */
export interface UserContext {
  lng: number;
  lat: number;
  zoom: number;
  year: number;
}

/**
 * Fold the live viewport and selected year into a {@link UserContext}. Pure and
 * injectable, so the derivation is testable without React or a map. Returns null
 * until the map first settles (`view` is null pre-settle).
 */
export function toUserContext(
  view: MapView | null,
  year: number,
): UserContext | null {
  if (!view) return null;
  return { lng: view.lng, lat: view.lat, zoom: view.zoom, year };
}

/**
 * The current {@link UserContext}, or null until the map first settles. Derived
 * from `view` + `selectedYear`; recomputes only when either changes.
 */
export function useUserContext(): UserContext | null {
  const { view, selectedYear } = useAtlas();
  return useMemo(() => toUserContext(view, selectedYear), [view, selectedYear]);
}
