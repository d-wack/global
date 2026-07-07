"use client";

import { cn } from "@/lib/utils";
import { useAtlas, type ToolId } from "@/state/atlas-context";

const TOOLS: { id: ToolId; label: string; icon: string }[] = [
  { id: "explore", label: "Explore", icon: "✥" },
  { id: "add", label: "Add", icon: "＋" },
  { id: "inspect", label: "Inspect", icon: "🔍" },
];

/**
 * The active-tool selector: explore (pan), add (drop an event), inspect (look up
 * a coordinate on Wikipedia). Replaces the old add-mode toggle.
 */
export function ToolBar() {
  const { activeTool, setActiveTool } = useAtlas();

  return (
    <div
      role="toolbar"
      aria-label="Map tools"
      className="absolute bottom-16 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full border border-white/10 bg-black/80 p-1 shadow-lg backdrop-blur"
    >
      {TOOLS.map((tool) => {
        const active = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            type="button"
            aria-pressed={active}
            onClick={() => setActiveTool(tool.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-emerald-400 text-black"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <span aria-hidden>{tool.icon}</span>
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
