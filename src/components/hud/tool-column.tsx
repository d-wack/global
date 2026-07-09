"use client";

import { cn } from "@/lib/utils";
import { useAtlas, type ToolId } from "@/state/atlas-context";

// Angular CoD-style clip (leading edge sheared top-left).
const CLIP_R = "polygon(14px 0, 100% 0, 100% 100%, 0 100%)";

const TOOLS: { id: ToolId; label: string; icon: string }[] = [
  { id: "explore", label: "Explore", icon: "✥" },
  { id: "add", label: "Add", icon: "＋" },
  { id: "inspect", label: "Inspect", icon: "🔍" },
];

/**
 * The right-edge tool column (Black Ops style): the active-tool selector
 * (explore/add/inspect) with the immersive-mode toggle docked at the bottom, so
 * the tools and the hide/show control read as one toolbar. The tool buttons hide
 * with the rest of the chrome; the immersive toggle ALWAYS renders, so in
 * immersive mode it remains on its own as the restore control.
 */
export function ToolColumn() {
  const { activeTool, setActiveTool, chromeVisible, toggleChrome } = useAtlas();
  const toggleLabel = chromeVisible ? "Hide interface" : "Show interface";

  return (
    <div className="absolute top-1/2 right-3 z-50 flex -translate-y-1/2 flex-col gap-2">
      {chromeVisible && (
        <>
          <div
            role="radiogroup"
            aria-label="Map tool"
            className="flex flex-col gap-2"
          >
            {TOOLS.map((tool) => {
              const active = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={tool.label}
                  title={tool.label}
                  onClick={() => setActiveTool(tool.id)}
                  style={{ clipPath: CLIP_R }}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center text-lg backdrop-blur-md transition-colors",
                    active
                      ? "bg-emerald-400/85 text-black shadow-[0_0_16px_rgba(16,185,129,0.6)]"
                      : "bg-black/40 text-white/70 hover:bg-white/15 hover:text-white",
                  )}
                >
                  <span aria-hidden>{tool.icon}</span>
                </button>
              );
            })}
          </div>
          {/* Divider between the tools and the immersive toggle. */}
          <span aria-hidden className="mx-auto h-px w-6 bg-white/15" />
        </>
      )}

      <button
        type="button"
        onClick={toggleChrome}
        aria-pressed={!chromeVisible}
        aria-label={toggleLabel}
        title={`${toggleLabel} (H)`}
        style={{ clipPath: CLIP_R }}
        className={cn(
          "flex h-11 w-11 items-center justify-center backdrop-blur-md transition-colors",
          "bg-black/40 text-white/70 hover:bg-white/15 hover:text-white",
          "focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:outline-none",
        )}
      >
        {chromeVisible ? <MaximizeIcon /> : <MinimizeIcon />}
      </button>
    </div>
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
