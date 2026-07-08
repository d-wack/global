"use client";

import { useEffect, useRef } from "react";

import { useAtlas } from "@/state/atlas-context";

const JSON_HEADERS = { "Content-Type": "application/json" };

/** How long the viewport must sit still before a settled view is logged. */
export const VIEW_LOG_DEBOUNCE_MS = 1500;

/**
 * Log settled views to `POST /api/views` (Concept #1 — the lite view-log).
 *
 * The *live* viewport drives display and updates on every pan; we log only the
 * *settled* view — after motion stops (`bounds`, emitted on `moveend`) or the
 * timeline year changes — debounced by {@link VIEW_LOG_DEBOUNCE_MS} so a drag
 * writes one row, not a frame's worth. Fire-and-forget: failures are ignored
 * (open mode no-ops server-side), and an identical consecutive view is skipped.
 *
 * The settled center/zoom is read from `view` through a ref, so the debounce
 * effect keys on the settle signals (`bounds`/`selectedYear`) and does not
 * re-fire on every live `move`.
 */
export function useViewLogger(): void {
  const { view, bounds, selectedYear } = useAtlas();

  // Latest live view, without making it an effect dependency (keeps the logger
  // keyed on the settle signals below, not on every move frame).
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  });

  // The last payload actually posted, to drop identical consecutive views.
  const lastPostedRef = useRef<string | null>(null);

  useEffect(() => {
    const settled = viewRef.current;
    if (!settled) return;

    const body = JSON.stringify({
      lng: settled.lng,
      lat: settled.lat,
      zoom: settled.zoom,
      year: selectedYear,
    });

    const timer = setTimeout(() => {
      if (lastPostedRef.current === body) return;
      lastPostedRef.current = body;
      // Fire-and-forget telemetry: no await, swallow every failure.
      void fetch("/api/views", {
        method: "POST",
        headers: JSON_HEADERS,
        body,
      }).catch(() => {});
    }, VIEW_LOG_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [bounds, selectedYear]);
}
