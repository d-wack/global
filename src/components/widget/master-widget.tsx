"use client";

import { useState } from "react";

import { LayerChooser } from "@/components/panel/layer-chooser";
import { BUILTIN_LAYERS } from "@/config/layers";
import { useAtlas } from "@/state/atlas-context";

import { AccountChip } from "./account-chip";
import { CollapsibleSection } from "./collapsible-section";
import { TimeControl } from "./time-control";

function coord(
  value: number | undefined,
  positive: string,
  negative: string,
): string {
  if (value === undefined) return "--.----";
  return `${Math.abs(value).toFixed(4)}°${value >= 0 ? positive : negative}`;
}

/**
 * The master control widget (upper-right): live coordinates, the layer chooser,
 * and the time control, in collapsible sections. The first of the Photoshop/
 * Blender-style dockable panels; the left side follows.
 */
export function MasterWidget() {
  const { view, activeLayerIds, toggleLayer, selectedYear, setSelectedYear } =
    useAtlas();
  const [maxYear] = useState(() => new Date().getFullYear());

  return (
    <div className="absolute top-3 right-3 z-20 w-64 max-w-[85vw] overflow-hidden rounded-lg border border-white/10 bg-black/80 shadow-lg backdrop-blur">
      <div className="border-b border-white/10 px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-emerald-400/60">
        PLANET ATLAS
      </div>

      <CollapsibleSection title="COORDINATES">
        <div className="font-mono text-xs leading-relaxed text-emerald-300 tabular-nums">
          <div>LAT {coord(view?.lat, "N", "S")}</div>
          <div>LNG {coord(view?.lng, "E", "W")}</div>
          <div>ZM&nbsp; {view ? view.zoom.toFixed(2) : "--.--"}</div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="LAYERS">
        <LayerChooser
          layers={BUILTIN_LAYERS}
          active={activeLayerIds}
          onToggle={toggleLayer}
        />
      </CollapsibleSection>

      <CollapsibleSection title="TIME">
        <TimeControl
          year={selectedYear}
          maxYear={maxYear}
          onChange={setSelectedYear}
        />
      </CollapsibleSection>

      {/* Renders nothing in open mode / when logged out. */}
      <AccountChip />
    </div>
  );
}
