"use client";

import { useAtlas } from "@/state/atlas-context";

// Angular CoD-style clip (leading edge sheared top-left).
const CLIP_R = "polygon(14px 0, 100% 0, 100% 100%, 0 100%)";
const SHADOW = "[text-shadow:0_1px_3px_rgba(0,0,0,0.9)]";

function coord(value: number | undefined, pos: string, neg: string): string {
  if (value === undefined) return "--.--°";
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? pos : neg}`;
}

/**
 * Ambient coordinate plate (top-right): a translucent, angular score-plate
 * readout of the current LAT/LNG/zoom. Reads `view` from context; shows dashes
 * when the map hasn't reported a viewport yet.
 */
export function CoordinatePlate() {
  const { view } = useAtlas();

  return (
    <div className="absolute top-3 right-3 z-30">
      <div
        style={{ clipPath: CLIP_R }}
        className="flex items-center gap-3 bg-black/40 py-2 pr-4 pl-5 backdrop-blur-md"
      >
        <span className="h-6 w-[3px] bg-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
        <div
          className={`font-sans text-[13px] font-medium tracking-wide text-white/90 tabular-nums ${SHADOW}`}
        >
          <span className="text-emerald-300/70">LAT</span>{" "}
          {coord(view?.lat, "N", "S")}
          <span className="mx-2 text-white/25">/</span>
          <span className="text-emerald-300/70">LNG</span>{" "}
          {coord(view?.lng, "E", "W")}
          <span className="mx-2 text-white/25">/</span>
          <span className="text-emerald-300/70">Z</span>{" "}
          {view ? view.zoom.toFixed(2) : "--"}
        </div>
      </div>
    </div>
  );
}
