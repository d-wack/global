"use client";

import { cn } from "@/lib/utils";
import { useAtlas } from "@/state/atlas-context";

import { AddEventForm } from "./add-event-form";

/**
 * Connects add-mode + click-to-place to the context: a toggle button and, once
 * the user clicks the map, the {@link AddEventForm}.
 */
export function AddControls() {
  const { activeTool, setActiveTool, pendingPoint, setPendingPoint, addEvent } =
    useAtlas();
  const isAdd = activeTool === "add";

  return (
    <>
      <button
        type="button"
        onClick={() => setActiveTool(isAdd ? "explore" : "add")}
        aria-pressed={isAdd}
        className={cn(
          "absolute bottom-16 left-1/2 z-20 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-colors",
          isAdd
            ? "bg-emerald-400 text-black"
            : "bg-white/10 text-white backdrop-blur hover:bg-white/20",
        )}
      >
        {isAdd ? "Click the map to place…" : "+ Add event"}
      </button>

      {pendingPoint && (
        <AddEventForm
          point={pendingPoint}
          onCancel={() => setPendingPoint(null)}
          onSubmit={async (input) => {
            const created = await addEvent(input);
            if (created) {
              setPendingPoint(null);
              setActiveTool("explore");
            }
          }}
        />
      )}
    </>
  );
}
