"use client";

import { yearParts } from "@/lib/timeline";
import { useAtlas } from "@/state/atlas-context";

// Angular CoD-style clip (leading edge sheared bottom-right).
const CLIP_L = "polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)";
const SHADOW = "[text-shadow:0_1px_3px_rgba(0,0,0,0.9)]";

/**
 * The big "temporal" stat (bottom-right): the current as-of year split into a
 * bold magnitude and a CE/BCE era tag. Reads `selectedYear` from context.
 * Replaces the old YearDisplay.
 */
export function YearStat() {
  const { selectedYear } = useAtlas();
  const { magnitude, era } = yearParts(selectedYear);

  return (
    <div className="absolute right-3 bottom-3 z-30">
      <div
        style={{ clipPath: CLIP_L }}
        className="bg-black/40 py-1.5 pr-6 pl-4 text-right backdrop-blur-md"
      >
        <div className="font-sans text-[10px] font-semibold tracking-[0.3em] text-emerald-300/70">
          TEMPORAL
        </div>
        <div
          className={`flex items-baseline justify-end gap-1 text-white ${SHADOW}`}
        >
          <span className="text-3xl font-bold tabular-nums">{magnitude}</span>
          <span className="text-xs font-semibold tracking-widest text-white/60">
            {era}
          </span>
        </div>
      </div>
    </div>
  );
}
