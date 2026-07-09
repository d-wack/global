import type { ReactNode } from "react";

import { AddControls } from "@/components/add/add-controls";
import { CoordinatePlate } from "@/components/hud/coordinate-plate";
import { TimelineStrip } from "@/components/hud/timeline-strip";
import { ToolColumn } from "@/components/hud/tool-column";
import { YearStat } from "@/components/hud/year-stat";
import { PlaceInfoPanel } from "@/components/inspect/place-info-panel";
import { LeftPanel } from "@/components/panel/left-panel";
import { PlacesPanel } from "@/components/places/places-panel";
import { GeocodeSearch } from "@/components/search/geocode-search";
import { MasterWidget } from "@/components/widget/master-widget";
import { cn } from "@/lib/utils";
import { useAtlas } from "@/state/atlas-context";

/**
 * The full-screen stage. Presentational: the globe is injected so this renders
 * in jsdom without MapLibre. When `chromeVisible` is false every overlay but the
 * globe is unmounted (immersive mode) and the wrapper gets `chrome-hidden`,
 * which also hides the MapLibre zoom control. The `ToolColumn` always renders:
 * it holds the immersive toggle, which must survive as the restore control.
 */
export function AtlasStageView({ globe }: { globe: ReactNode }) {
  const { chromeVisible } = useAtlas();
  return (
    <div
      className={cn(
        "atlas-space fixed inset-0 overflow-hidden",
        !chromeVisible && "chrome-hidden",
      )}
    >
      {globe}
      {chromeVisible && (
        <>
          <MasterWidget />
          <LeftPanel />
          <PlacesPanel />
          <GeocodeSearch />
          <CoordinatePlate />
          <AddControls />
          <PlaceInfoPanel />
          <YearStat />
          <TimelineStrip />
        </>
      )}
      {/* Always mounted: the tool selector hides with the chrome, but the
          immersive toggle it carries stays visible as the restore control. */}
      <ToolColumn />
    </div>
  );
}
