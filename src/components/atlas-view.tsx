"use client";

import dynamic from "next/dynamic";

import { AddControls } from "@/components/add/add-controls";
import { YearDisplay } from "@/components/hud/year-display";
import { PlaceInfoPanel } from "@/components/inspect/place-info-panel";
import { LeftPanel } from "@/components/panel/left-panel";
import { GeocodeSearch } from "@/components/search/geocode-search";
import { TimelineScrubber } from "@/components/timeline/timeline-scrubber";
import { ToolBar } from "@/components/toolbar/tool-bar";
import { MasterWidget } from "@/components/widget/master-widget";
import { AtlasProvider } from "@/state/atlas-context";

// MapLibre touches the DOM/WebGL and must not render on the server.
const GlobeMap = dynamic(() => import("@/components/globe/globe-map"), {
  ssr: false,
});

/**
 * Full-screen shell that composes the globe and its overlays under a single
 * {@link AtlasProvider}. The left panel and add/search overlays are layered in
 * as the slice progresses.
 */
export function AtlasView() {
  return (
    <AtlasProvider>
      <div className="atlas-space fixed inset-0 overflow-hidden">
        <GlobeMap />
        <MasterWidget />
        <LeftPanel />
        <GeocodeSearch />
        <ToolBar />
        <AddControls />
        <PlaceInfoPanel />
        <YearDisplay />
        <TimelineScrubber />
      </div>
    </AtlasProvider>
  );
}
