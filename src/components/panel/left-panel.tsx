"use client";

import { useEffect, useMemo, useState } from "react";

import { rankByImportance } from "@/lib/importance";
import { applyLayerFilter } from "@/lib/layers";
import { filterAsOf } from "@/lib/timeline";
import { filterVisible, searchFilter } from "@/lib/viewport";
import { useAtlas } from "@/state/atlas-context";

import { EventListItem } from "./event-list-item";

/**
 * The viewport-ranked panel: what matters at the current zoom/level right now.
 * Filters events to the viewport (client-side), then by layer and search, then
 * ranks by importance. Derivations are pure and memoized.
 */
export function LeftPanel() {
  const {
    events,
    bounds,
    selectedYear,
    activeLayerIds,
    search,
    setSearch,
    voteEvent,
    loading,
  } = useAtlas();

  // `now` feeds the recency decay. Captured at mount (out of render, to stay
  // pure) and refreshed each minute so ranking stays current over a session.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const inView = useMemo(() => {
    const asOf = filterAsOf(events, selectedYear);
    return bounds ? filterVisible(asOf, bounds) : asOf;
  }, [events, bounds, selectedYear]);

  const ranked = useMemo(
    () =>
      rankByImportance(
        searchFilter(applyLayerFilter(inView, activeLayerIds), search),
        now,
      ),
    [inView, activeLayerIds, search, now],
  );

  return (
    <aside className="absolute top-3 bottom-16 left-3 z-10 flex w-72 max-w-[85vw] flex-col">
      <div className="mb-2 space-y-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          aria-label="Search events"
          className="w-full rounded-md bg-black/30 px-2.5 py-1.5 text-sm text-white ring-1 ring-white/10 backdrop-blur-sm outline-none placeholder:text-white/30 focus:ring-emerald-400/40"
        />
        <p className="font-mono text-[11px] text-emerald-300/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
          {inView.length} event{inView.length === 1 ? "" : "s"} in view
        </p>
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
        {ranked.map((event) => (
          <EventListItem
            key={event.id}
            event={event}
            onVote={(direction) => voteEvent(event.id, direction)}
          />
        ))}
        {ranked.length === 0 && (
          <li className="rounded-md bg-black/20 p-4 text-center text-xs text-white/40 ring-1 ring-white/10 backdrop-blur-sm">
            {loading ? "Loading…" : "No events here. Zoom out, or add one."}
          </li>
        )}
      </ul>
    </aside>
  );
}
