"use client";

import { LAYERS_BY_ID } from "@/config/layers";
import type { AtlasEvent, VoteDirection } from "@/types/event";

import { VoteControls } from "./vote-controls";

/** One ranked event row: votes, layer dot, title, and description. */
export function EventListItem({
  event,
  onVote,
}: {
  event: AtlasEvent;
  onVote: (direction: VoteDirection) => void;
}) {
  const firstLayerId = event.layerIds[0];
  const color =
    (firstLayerId ? LAYERS_BY_ID.get(firstLayerId) : undefined)?.color ??
    "#38bdf8";

  return (
    <li className="flex gap-3 border-b border-white/5 px-3 py-2.5">
      <VoteControls votes={event.votes} onVote={onVote} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: color }}
          />
          <h3 className="truncate text-sm font-medium text-white/90">
            {event.title}
          </h3>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-white/50">
          {event.description}
        </p>
      </div>
    </li>
  );
}
