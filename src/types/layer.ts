/**
 * Layers — the display-grouping model (GIS / Photoshop style).
 *
 * An {@link AtlasEvent} belongs to one or more layers (many-to-many via
 * `layerIds`). A layer carries the marker's color and shape and can be toggled
 * on/off. The three built-ins (News/Events/Historical) live in
 * `src/config/layers.ts`; user-created, persisted layers come in a later phase.
 */

export type MarkerShape = "circle" | "square" | "diamond";

export interface Layer {
  id: string;
  name: string;
  /** CSS color for markers + swatches. */
  color: string;
  shape: MarkerShape;
  /** True for the shipped layers; false for user-created ones (later). */
  builtin: boolean;
  /** Whether the layer starts visible. */
  defaultVisible: boolean;
}
