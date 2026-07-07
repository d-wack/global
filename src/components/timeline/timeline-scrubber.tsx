"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { cn } from "@/lib/utils";
import {
  TIMELINE_MIN_YEAR,
  formatYear,
  fractionToYear,
  yearToFraction,
} from "@/lib/timeline";
import { useAtlas } from "@/state/atlas-context";

// Years to label along the track (placed at their computed, non-even fractions).
const TICK_YEARS = [2000, 1500, 1000, 1, -1000, -2000, TIMELINE_MIN_YEAR];
const KEY_STEP = 0.03;

/**
 * Bottom "travel back in time" scrubber. Reads/writes `selectedYear` on the
 * era-compressed scale (recent years get most of the track). Selecting a year
 * shows everything up to that year (as-of); dragging back hides recent events.
 */
export function TimelineScrubber() {
  const { selectedYear, setSelectedYear } = useAtlas();
  // Current year captured out of render (purity), and the scale's right edge.
  const [maxYear] = useState(() => new Date().getFullYear());
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const clampYear = (year: number) =>
    Math.min(maxYear, Math.max(TIMELINE_MIN_YEAR, year));

  const yearFromClientX = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return selectedYear;
    const rect = el.getBoundingClientRect();
    const fraction = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    return clampYear(fractionToYear(fraction, maxYear));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    trackRef.current?.setPointerCapture(e.pointerId);
    setSelectedYear(yearFromClientX(e.clientX));
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) setSelectedYear(yearFromClientX(e.clientX));
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    trackRef.current?.releasePointerCapture(e.pointerId);
  };

  // Step by a fraction of the track, but always move at least one year (near the
  // present a small fraction is sub-year and would round to the same year).
  const stepYear = (dir: -1 | 1) => {
    const frac = yearToFraction(selectedYear, maxYear);
    let next = clampYear(fractionToYear(frac + dir * KEY_STEP, maxYear));
    if (dir < 0 && next >= selectedYear) next = clampYear(selectedYear - 1);
    if (dir > 0 && next <= selectedYear) next = clampYear(selectedYear + 1);
    setSelectedYear(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      stepYear(-1);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      stepYear(1);
    } else if (e.key === "Home") {
      setSelectedYear(TIMELINE_MIN_YEAR);
    } else if (e.key === "End") {
      setSelectedYear(maxYear);
    } else {
      return;
    }
    e.preventDefault();
  };

  const handleFraction = yearToFraction(selectedYear, maxYear);
  const atPresent = selectedYear >= maxYear;

  return (
    <div className="absolute right-16 bottom-0 left-0 z-40 flex h-14 items-center gap-4 border-t border-white/10 bg-black/80 px-4 backdrop-blur">
      <div className="w-40 shrink-0 font-mono text-xs text-emerald-300">
        <span className="text-emerald-400/60">AS OF </span>
        {formatYear(selectedYear)}
        {atPresent && <span className="text-white/40"> · all</span>}
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Timeline year"
        aria-valuemin={TIMELINE_MIN_YEAR}
        aria-valuemax={maxYear}
        aria-valuenow={selectedYear}
        aria-valuetext={formatYear(selectedYear)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative h-8 flex-1 cursor-pointer touch-none select-none"
      >
        {/* rail */}
        <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 rounded bg-white/15" />
        {/* filled portion up to the handle */}
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded bg-emerald-400/70"
          style={{ width: `${handleFraction * 100}%` }}
        />
        {/* tick labels */}
        {TICK_YEARS.map((y) => (
          <span
            key={y}
            className="pointer-events-none absolute top-1/2 mt-2 -translate-x-1/2 font-mono text-[9px] text-white/35"
            style={{ left: `${yearToFraction(y, maxYear) * 100}%` }}
          >
            {formatYear(y)}
          </span>
        ))}
        {/* handle */}
        <div
          className={cn(
            "absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-emerald-400 shadow",
            dragging && "ring-2 ring-emerald-300/50",
          )}
          style={{ left: `${handleFraction * 100}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => setSelectedYear(maxYear)}
        disabled={atPresent}
        className="shrink-0 rounded-md px-2.5 py-1 text-xs text-white/60 hover:text-white disabled:opacity-30"
      >
        Reset
      </button>
    </div>
  );
}
