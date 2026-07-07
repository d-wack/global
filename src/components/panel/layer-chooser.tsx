"use client";

import { cn } from "@/lib/utils";
import type { Layer } from "@/types/layer";

const SHAPE_CLASS: Record<string, string> = {
  circle: "rounded-full",
  square: "rounded-[2px]",
  diamond: "rounded-[2px] rotate-45",
};

/** Toggle chips for layers, each with a color + shape swatch; inactive chips dim. */
export function LayerChooser({
  layers,
  active,
  onToggle,
}: {
  layers: Layer[];
  active: ReadonlySet<string>;
  onToggle: (layerId: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {layers.map((layer) => {
        const on = active.has(layer.id);
        return (
          <button
            key={layer.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(layer.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-opacity",
              on
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-white/40 opacity-60 hover:opacity-100",
            )}
          >
            <span
              className={cn("h-2 w-2", SHAPE_CLASS[layer.shape])}
              style={{ background: layer.color }}
            />
            {layer.name}
          </button>
        );
      })}
      {/* Custom layers (create/edit) arrive in Phase B. */}
      <button
        type="button"
        disabled
        aria-label="Add layer"
        title="Custom layers coming soon"
        className="rounded-full border border-dashed border-white/15 px-2 py-1 text-xs text-white/30"
      >
        +
      </button>
    </div>
  );
}
