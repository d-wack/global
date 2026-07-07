"use client";

import { useState } from "react";

import type { PlaceInfoState } from "@/hooks/use-place-info";

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

/**
 * Right-side drawer listing nearby Wikipedia articles for an inspected point.
 * Presentational: takes the place-info state + a close handler. Clicking a row
 * toggles its already-loaded intro extract.
 */
export function PlaceInfoView({
  placeInfo,
  onClose,
}: {
  placeInfo: PlaceInfoState;
  onClose: () => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { point, loading, error, results } = placeInfo;

  return (
    <aside className="absolute top-0 right-0 bottom-14 z-20 flex w-96 max-w-[85vw] flex-col border-l border-white/10 bg-black/85 backdrop-blur">
      <header className="flex items-center justify-between border-b border-white/10 p-3">
        <div className="font-mono text-xs text-emerald-300">
          <span aria-hidden>📍 </span>
          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="px-1 text-white/50 hover:text-white"
        >
          ✕
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && (
          <p className="p-4 text-sm text-white/50">Searching Wikipedia…</p>
        )}
        {error && <p className="p-4 text-sm text-red-400">{error}</p>}
        {!loading && !error && results.length === 0 && (
          <p className="p-4 text-sm text-white/50">No nearby articles.</p>
        )}

        <ul>
          {results.map((r) => (
            <li key={r.pageId} className="border-b border-white/5">
              <button
                type="button"
                onClick={() =>
                  setExpandedId((id) => (id === r.pageId ? null : r.pageId))
                }
                aria-expanded={expandedId === r.pageId}
                className="flex w-full gap-3 p-3 text-left hover:bg-white/5"
              >
                {r.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.thumbnailUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate text-sm font-medium text-white/90">
                      {r.title}
                    </h3>
                    <span className="shrink-0 font-mono text-[10px] text-white/40">
                      {formatDistance(r.distanceMeters)}
                    </span>
                  </div>
                  {r.description && (
                    <p className="truncate text-xs text-white/50">
                      {r.description}
                    </p>
                  )}
                </div>
              </button>

              {expandedId === r.pageId && (
                <div className="px-3 pb-3 text-xs leading-relaxed text-white/70">
                  {r.extract && <p className="mb-2">{r.extract}</p>}
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-300 hover:underline"
                  >
                    Read on Wikipedia →
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
