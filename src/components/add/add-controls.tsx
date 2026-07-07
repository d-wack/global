"use client";

import { useAtlas } from "@/state/atlas-context";

import { AddEventForm } from "./add-event-form";

/**
 * Click-to-place for the add tool: a hint while armed, then the
 * {@link AddEventForm} once the user clicks the map. Tool selection lives in the
 * ToolBar.
 */
export function AddControls() {
  const { activeTool, pendingPoint, setPendingPoint, setActiveTool, addEvent } =
    useAtlas();

  return (
    <>
      {activeTool === "add" && !pendingPoint && (
        <p className="pointer-events-none absolute bottom-28 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white/80 backdrop-blur">
          Click the map to place an event
        </p>
      )}

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
