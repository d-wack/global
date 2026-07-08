"use client";

import { CollapsibleSection } from "@/components/widget/collapsible-section";
import { useViews } from "@/hooks/use-views";
import { useAtlas } from "@/state/atlas-context";
import type { UserView } from "@/types/view";

import { PlacesView } from "./places-view";

/**
 * "Places I've visited" (Concept #1): the caller's recent settled views, with
 * click-to-fly-back. A small glass overlay docked bottom-right above the
 * timeline, clear of the left panel. In open mode the list is empty (the
 * endpoint returns no rows).
 */
export function PlacesPanel() {
  const { views, loading } = useViews();
  const { flyToView, setSelectedYear } = useAtlas();

  const flyBack = (view: UserView) => {
    flyToView({ lng: view.lng, lat: view.lat }, view.zoom);
    setSelectedYear(view.year);
  };

  return (
    <div className="absolute right-3 bottom-16 z-20 w-56 max-w-[85vw] overflow-hidden rounded-lg border border-white/10 bg-black/80 shadow-lg backdrop-blur">
      <CollapsibleSection title="PLACES I'VE VISITED" defaultOpen={false}>
        <PlacesView views={views} loading={loading} onSelect={flyBack} />
      </CollapsibleSection>
    </div>
  );
}
