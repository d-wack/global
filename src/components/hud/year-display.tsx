"use client";

import { useAtlas } from "@/state/atlas-context";

/**
 * Big "game HUD" year readout in the lower-right — a prominent, glowing display
 * of the current as-of year. Purely presentational; pointer-events off so it
 * never blocks the map.
 */
export function YearDisplay() {
  const { selectedYear } = useAtlas();
  const era = selectedYear < 0 ? "BCE" : "CE";
  const value = Math.abs(selectedYear);

  return (
    <div className="pointer-events-none absolute right-12 bottom-44 z-10 flex flex-col items-end select-none">
      <div className="font-mono text-[11px] tracking-[0.5em] text-emerald-400/50">
        YEAR
      </div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-7xl leading-none font-bold text-emerald-300 tabular-nums [text-shadow:0_0_25px_rgba(52,211,153,0.55)]">
          {value}
        </span>
        <span className="mb-1 font-mono text-2xl font-semibold tracking-[0.2em] text-emerald-400/80 [text-shadow:0_0_15px_rgba(52,211,153,0.4)]">
          {era}
        </span>
      </div>
    </div>
  );
}
