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

/**
 * The full-screen stage. Presentational: the globe and toggle are injected so
 * this renders in jsdom without MapLibre or context. When `chromeVisible` is
 * false every overlay but the globe is unmounted (immersive mode) and the
 * wrapper gets `chrome-hidden`, which also hides the MapLibre zoom control.
 */
export function AtlasStageView({
  chromeVisible,
  globe,
  toggle,
}: {
  chromeVisible: boolean;
  globe: ReactNode;
  toggle: ReactNode;
}) {
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
          <ToolColumn />
          <AddControls />
          <PlaceInfoPanel />
          <YearStat />
          <TimelineStrip />
        </>
      )}
      {toggle}
    </div>
  );
}
