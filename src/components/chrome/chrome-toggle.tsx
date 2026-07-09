"use client";

import { cn } from "@/lib/utils";

/**
 * Corner control that flips immersive mode. Always visible: when the chrome is
 * hidden it is the only overlay left, so it doubles as the restore control.
 * Presentational — the connector supplies state so it stays easy to test.
 */
export function ChromeToggle({
  chromeVisible,
  onToggle,
}: {
  chromeVisible: boolean;
  onToggle: () => void;
}) {
  const label = chromeVisible ? "Hide interface" : "Show interface";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={!chromeVisible}
      aria-label={label}
      title={`${label} (H)`}
      className={cn(
        // Docked directly under the MapLibre zoom control (same left offset) so
        // the two read as one top-left control cluster instead of overlapping.
        "absolute top-[116px] left-[21rem] z-50 flex h-[30px] w-[30px] items-center justify-center",
        "rounded border border-white/10 bg-black/80 text-white/70 shadow-lg backdrop-blur transition-colors",
        "hover:bg-white/10 hover:text-white",
        "focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:outline-none",
      )}
    >
      {chromeVisible ? <MaximizeIcon /> : <MinimizeIcon />}
    </button>
  );
}

/** Arrows to the corners — "expand the globe" (enter immersive). */
function MaximizeIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

/** Arrows drawn inward — "restore the interface" (exit immersive). */
function MinimizeIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
