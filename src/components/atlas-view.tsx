"use client";

import dynamic from "next/dynamic";

import { InstrumentReadout } from "@/components/globe/instrument-readout";
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
      <div className="fixed inset-0 overflow-hidden bg-[#05070a]">
        <GlobeMap />
        <InstrumentReadout />
      </div>
    </AtlasProvider>
  );
}
