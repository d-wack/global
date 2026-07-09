"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import {
  TIMELINE_MIN_YEAR,
  formatYear,
  fractionToYear,
  yearToFraction,
} from "@/lib/timeline";
import { useAtlas } from "@/state/atlas-context";

const SHADOW = "[text-shadow:0_1px_3px_rgba(0,0,0,0.9)]";
const KEY_STEP = 0.03;

// Era boundaries (start year) labelled along the strip; only those that fall
// strictly inside the visible track are shown.
const ERAS: readonly { from: number; label: string }[] = [
  { from: -100000, label: "ANTIQUITY" },
  { from: -500, label: "CLASSICAL" },
  { from: 500, label: "MEDIEVAL" },
  { from: 1500, label: "MODERN" },
];

/**
 * The faint full-width bottom timeline strip. Default dim; brightens and reveals
 * era labels on hover/focus. Reads/writes `selectedYear` on the era-compressed
 * scale. Pointer-capture drag + Arrow/Home/End keyboard mirror the old scrubber.
 * Replaces the old TimelineScrubber.
 */
export function TimelineStrip() {
  const { selectedYear, setSelectedYear } = useAtlas();
  // Current year captured out of render (purity) — the scale's right edge.
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

  const fraction = yearToFraction(selectedYear, maxYear);
  const ticks = ERAS.map((e) => ({
    label: e.label,
    left: yearToFraction(Math.max(e.from, TIMELINE_MIN_YEAR), maxYear),
  })).filter((t) => t.left > 0.001 && t.left < 0.999);

  return (
    <div className="group absolute inset-x-0 bottom-[50px] z-40 pr-72 pb-2 pl-6 opacity-55 transition-opacity duration-200 focus-within:opacity-100 hover:opacity-100">
      {/* Era labels reveal only when the strip is active. */}
      <div
        aria-hidden
        className="relative mb-1 h-3 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {ticks.map((t) => (
          <span
            key={t.label}
            className={`absolute font-sans text-[9px] font-semibold tracking-[0.2em] text-white/50 ${SHADOW}`}
            style={{ left: `${t.left * 100}%`, transform: "translateX(-50%)" }}
          >
            {t.label}
          </span>
        ))}
      </div>

      {/* Tall transparent hit area with a thin visual line centered in it. */}
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
        className="relative flex h-6 cursor-pointer touch-none items-center outline-none select-none"
      >
        <div className="relative h-[3px] w-full rounded-full bg-white/15 backdrop-blur-sm">
          {/* Filled portion up to the playhead. */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-emerald-400/70"
            style={{ width: `${fraction * 100}%` }}
          />
          {/* Era boundary ticks. */}
          {ticks.map((t) => (
            <span
              key={t.label}
              aria-hidden
              className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/30"
              style={{ left: `${t.left * 100}%` }}
            />
          ))}
          {/* Glowing playhead dot. */}
          <span
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.9)] ring-2 ring-black/40 group-focus-within:ring-emerald-300/50"
            style={{ left: `${fraction * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
