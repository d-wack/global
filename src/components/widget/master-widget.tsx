"use client";

import { LayerChooser } from "@/components/panel/layer-chooser";
import { BUILTIN_LAYERS } from "@/config/layers";
import { useAtlas } from "@/state/atlas-context";

import { AccountChip } from "./account-chip";
import { CollapsibleSection } from "./collapsible-section";

/**
 * The master control widget (upper-right): the layer chooser and account chip in
 * collapsible sections. Coordinates and the as-of year now live in the ambient
 * HUD (CoordinatePlate / YearStat / TimelineStrip), so this sits below the
 * coordinate plate to avoid overlapping it.
 */
export function MasterWidget() {
  const { activeLayerIds, toggleLayer } = useAtlas();

  return (
    <div className="absolute top-16 right-3 z-20 w-64 max-w-[85vw] overflow-hidden rounded-lg border border-white/10 bg-black/80 shadow-lg backdrop-blur">
      <div className="border-b border-white/10 px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-emerald-400/60">
        PLANET ATLAS
      </div>

      <CollapsibleSection title="LAYERS">
        <LayerChooser
          layers={BUILTIN_LAYERS}
          active={activeLayerIds}
          onToggle={toggleLayer}
        />
      </CollapsibleSection>

      {/* Renders nothing in open mode / when logged out. */}
      <AccountChip />
    </div>
  );
}
