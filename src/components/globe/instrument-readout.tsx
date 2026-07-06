"use client";

import { useAtlas } from "@/state/atlas-context";

function coord(
  value: number | undefined,
  positive: string,
  negative: string,
): string {
  if (value === undefined) return "--.----";
  const hemisphere = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(4)}°${hemisphere}`;
}

/**
 * Monospace "situation-room" instrument readout: live latitude, longitude, and
 * zoom of the map center. Purely presentational; pointer-events off so it never
 * intercepts map interaction.
 */
export function InstrumentReadout() {
  const { view } = useAtlas();

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-10 rounded-md border border-emerald-400/20 bg-black/70 px-3 py-2 font-mono text-xs leading-relaxed text-emerald-300 tabular-nums backdrop-blur">
      <div className="mb-1 text-[10px] tracking-[0.2em] text-emerald-400/60">
        PLANET ATLAS
      </div>
      <div>LAT {coord(view?.lat, "N", "S")}</div>
      <div>LNG {coord(view?.lng, "E", "W")}</div>
      <div>ZM&nbsp; {view ? view.zoom.toFixed(2) : "--.--"}</div>
    </div>
  );
}
