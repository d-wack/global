"use client";

import { formatYear } from "@/lib/timeline";
import type { UserView } from "@/types/view";

/** Compact label for one visited view: "27.9,-82.5 · z12 · 1865 CE". */
export function formatViewLabel(view: UserView): string {
  return `${view.lat.toFixed(1)},${view.lng.toFixed(1)} · z${Math.round(
    view.zoom,
  )} · ${formatYear(view.year)}`;
}

/**
 * Presentational "places I've visited" list. Purely driven by props so it's
 * testable without the map or the network. Each row flies the map back to that
 * view when clicked.
 */
export function PlacesView({
  views,
  loading,
  onSelect,
}: {
  views: UserView[];
  loading: boolean;
  onSelect: (view: UserView) => void;
}) {
  if (views.length === 0) {
    return (
      <p className="px-1 py-2 text-center text-[11px] text-white/40">
        {loading ? "Loading…" : "Nowhere yet. Pan and zoom to build a trail."}
      </p>
    );
  }

  return (
    <ul className="max-h-48 space-y-0.5 overflow-y-auto">
      {views.map((view) => (
        <li key={view.id}>
          <button
            type="button"
            onClick={() => onSelect(view)}
            aria-label={`Fly to ${formatViewLabel(view)}`}
            className="w-full truncate rounded px-2 py-1 text-left font-mono text-[11px] text-emerald-300/80 tabular-nums hover:bg-white/5 hover:text-emerald-200"
          >
            {formatViewLabel(view)}
          </button>
        </li>
      ))}
    </ul>
  );
}
