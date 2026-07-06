"use client";

import { cn } from "@/lib/utils";
import { useAtlas } from "@/state/atlas-context";

import { AddEventForm } from "./add-event-form";

/**
 * Connects add-mode + click-to-place to the context: a toggle button and, once
 * the user clicks the map, the {@link AddEventForm}.
 */
export function AddControls() {
  const { addMode, setAddMode, pendingPoint, setPendingPoint, addEvent } =
    useAtlas();

  const toggle = () => {
    const next = !addMode;
    setAddMode(next);
    if (!next) setPendingPoint(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={addMode}
        className={cn(
          "absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-colors",
          addMode
            ? "bg-emerald-400 text-black"
            : "bg-white/10 text-white backdrop-blur hover:bg-white/20",
        )}
      >
        {addMode ? "Click the map to place…" : "+ Add event"}
      </button>

      {pendingPoint && (
        <AddEventForm
          point={pendingPoint}
          onCancel={() => setPendingPoint(null)}
          onSubmit={async (input) => {
            const created = await addEvent(input);
            if (created) {
              setPendingPoint(null);
              setAddMode(false);
            }
          }}
        />
      )}
    </>
  );
}
