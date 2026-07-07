"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { TIMELINE_MIN_YEAR, formatYear } from "@/lib/timeline";

const RELATIVE: { label: string; year: (max: number) => number }[] = [
  { label: "Present", year: (m) => m },
  { label: "−100y", year: (m) => m - 100 },
  { label: "−1000y", year: (m) => m - 1000 },
  { label: "Antiquity", year: () => -2000 },
];

/**
 * As-of time control (AWS-CloudWatch style Relative/Absolute). Relative offers
 * quick jumps; Absolute takes a precise year (BCE-capable). Both set the shared
 * `selectedYear` — a bridge until the zoomable point/range timeline (Phase C).
 */
export function TimeControl({
  year,
  maxYear,
  onChange,
}: {
  year: number;
  maxYear: number;
  onChange: (year: number) => void;
}) {
  const [mode, setMode] = useState<"relative" | "absolute">("relative");
  const clamp = (y: number) =>
    Math.min(maxYear, Math.max(TIMELINE_MIN_YEAR, y));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-white/70">As of {formatYear(year)}</span>
        <div className="flex overflow-hidden rounded border border-white/10 text-[10px]">
          {(["relative", "absolute"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2 py-0.5 capitalize",
                mode === m ? "bg-emerald-400 text-black" : "text-white/60",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "relative" ? (
        <div className="flex flex-wrap gap-1">
          {RELATIVE.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => onChange(clamp(r.year(maxYear)))}
              className="rounded border border-white/10 px-2 py-1 text-[11px] text-white/70 hover:bg-white/10"
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : (
        <input
          aria-label="Year"
          type="number"
          value={year}
          onChange={(e) => {
            const y = e.target.valueAsNumber;
            if (Number.isFinite(y)) onChange(clamp(y));
          }}
          className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-emerald-400/40"
        />
      )}
    </div>
  );
}
