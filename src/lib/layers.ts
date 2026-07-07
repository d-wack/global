import { LAYERS_BY_ID } from "@/config/layers";
import type { AtlasEvent } from "@/types/event";
import type { Layer, MarkerShape } from "@/types/layer";

/**
 * Pure layer helpers — filtering and marker styling — so the map/panel logic is
 * testable without React or MapLibre.
 */

/** Keep events belonging to at least one active layer. Empty set shows nothing. */
export function applyLayerFilter(
  events: readonly AtlasEvent[],
  active: ReadonlySet<string>,
): AtlasEvent[] {
  return events.filter((event) => event.layerIds.some((id) => active.has(id)));
}

export interface MarkerStyle {
  color: string;
  shape: MarkerShape;
}

const DEFAULT_STYLE: MarkerStyle = { color: "#38bdf8", shape: "circle" };

/**
 * The marker style for an event: the first of its layers that is both visible
 * and known wins; otherwise the first known layer; otherwise a default circle.
 */
export function resolveMarkerStyle(
  event: AtlasEvent,
  active: ReadonlySet<string>,
  byId: ReadonlyMap<string, Layer> = LAYERS_BY_ID,
): MarkerStyle {
  for (const id of event.layerIds) {
    if (!active.has(id)) continue;
    const layer = byId.get(id);
    if (layer) return { color: layer.color, shape: layer.shape };
  }
  for (const id of event.layerIds) {
    const layer = byId.get(id);
    if (layer) return { color: layer.color, shape: layer.shape };
  }
  return DEFAULT_STYLE;
}
