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
 * The active-tool selector as a slim right-edge icon column (Black Ops style):
 * explore (pan), add (drop an event), inspect (look up a coordinate). Reads and
 * writes `activeTool` on context. Replaces the old centered ToolBar.
 */
export function ToolColumn() {
  const { activeTool, setActiveTool } = useAtlas();

  return (
    <div
      role="radiogroup"
      aria-label="Map tool"
      className="absolute top-1/2 right-3 z-40 flex -translate-y-1/2 flex-col gap-2"
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
  );
}
