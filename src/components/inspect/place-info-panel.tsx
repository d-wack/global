"use client";

import { useAtlas } from "@/state/atlas-context";

import { PlaceInfoView } from "./place-info-view";

/** Connects the inspect drawer to the context; renders nothing when closed. */
export function PlaceInfoPanel() {
  const { placeInfo, clearPlaceInfo } = useAtlas();
  if (!placeInfo) return null;
  return <PlaceInfoView placeInfo={placeInfo} onClose={clearPlaceInfo} />;
}
