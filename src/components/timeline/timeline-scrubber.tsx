"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import {
  TIMELINE_MIN_YEAR,
  formatYear,
  fractionToYear,
  yearParts,
  yearToFraction,
} from "@/lib/timeline";
import { useAtlas } from "@/state/atlas-context";

// Era bands (start year → label), ordered oldest to newest. Each band runs until
// the next one begins; the last stretches to the present. Deep-history starts are
// clamped to the scale's floor so ANTIQUITY still shows on a -3000 → now track.
const ERAS: readonly { from: number; label: string }[] = [
  { from: -100000, label: "ANTIQUITY" },
  { from: -500, label: "CLASSICAL" },
  { from: 500, label: "MEDIEVAL" },
  { from: 1500, label: "MODERN" },
];

const KEY_STEP = 0.03;

/**
 * Bottom "temporal lock" scrubber — a sci-fi HUD readout for the as-of year.
 * Reads/writes `selectedYear` on the era-compressed scale (recent years get most
 * of the track). Selecting a year shows everything up to that year (as-of);
 * dragging back hides recent events. An emerald situation-room glass bar with
 * labeled era bands, an ambient scan line, a diamond playhead, and the active
 * year integrated as a large glass readout.
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

  const fraction = yearToFraction(selectedYear, maxYear);
  const { magnitude, era } = yearParts(selectedYear);

  // Era bands as [left, width] track fractions; drop any squeezed to nothing.
  const bands = ERAS.map((e, i) => {
    const start = Math.max(e.from, TIMELINE_MIN_YEAR);
    const end = i + 1 < ERAS.length ? ERAS[i + 1]!.from : maxYear;
    const left = yearToFraction(start, maxYear);
    const right = yearToFraction(end, maxYear);
    return { label: e.label, left, width: Math.max(0, right - left) };
  }).filter((b) => b.width > 0.001);

  return (
    <div className="absolute right-16 bottom-3 left-3 z-40">
      <div className="rounded-lg border border-emerald-400/25 bg-[#02110c]/80 p-4 shadow-[0_0_30px_rgba(16,185,129,0.1)] backdrop-blur">
        {/* Integrated readout header */}
        <div className="mb-3 flex items-baseline justify-between font-mono">
          <span className="text-[10px] tracking-[0.35em] text-emerald-400/60">
            TEMPORAL LOCK
          </span>
          <span className="flex items-baseline gap-1 text-emerald-300 [text-shadow:0_0_14px_rgba(16,185,129,0.6)]">
            <span className="text-4xl font-bold tabular-nums">{magnitude}</span>
            <span className="text-sm font-semibold tracking-widest text-emerald-400/80">
              {era}
            </span>
          </span>
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
          className="relative h-11 cursor-pointer touch-none overflow-hidden rounded-md border border-emerald-400/20 bg-black/50 outline-none select-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
        >
          {/* Era bands */}
          {bands.map((b) => (
            <div
              key={b.label}
              className="absolute inset-y-0 flex items-end justify-center border-r border-emerald-400/10 bg-emerald-400/[0.04]"
              style={{ left: `${b.left * 100}%`, width: `${b.width * 100}%` }}
            >
              <span className="mb-1 truncate px-1 font-mono text-[8px] tracking-[0.25em] text-emerald-300/40">
                {b.label}
              </span>
            </div>
          ))}

          {/* Filled region up to the playhead */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/10 to-emerald-400/25"
            style={{ width: `${fraction * 100}%` }}
          />

          {/* Ambient scan line (paused for reduced motion via globals.css) */}
          <div
            aria-hidden
            className="anim-hud-scan pointer-events-none absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-emerald-300/25 to-transparent"
          />

          {/* Diamond playhead */}
          <div
            className="pointer-events-none absolute inset-y-0 w-[2px] bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.9)]"
            style={{ left: `${fraction * 100}%` }}
          >
            <span className="absolute -top-[3px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
            <span className="absolute -bottom-[3px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
