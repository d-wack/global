import type { Layer } from "@/types/layer";

/**
 * Built-in layers — the shipped display groups (formerly the news/event/
 * historical categories). Ids reuse the old category strings so existing data
 * migrates mechanically. User-created, persisted layers are a later phase; these
 * live in code so marker color/shape resolution works even against an empty store.
 */
export const BUILTIN_LAYERS: Layer[] = [
  {
    id: "news",
    name: "News",
    color: "#38bdf8", // sky
    shape: "circle",
    builtin: true,
    defaultVisible: true,
  },
  {
    id: "event",
    name: "Events",
    color: "#a78bfa", // violet
    shape: "diamond",
    builtin: true,
    defaultVisible: true,
  },
  {
    id: "historical",
    name: "Historical",
    color: "#fbbf24", // amber
    shape: "square",
    builtin: true,
    defaultVisible: true,
  },
];

/** Lookup by id (returns `Layer | undefined`). */
export const LAYERS_BY_ID: ReadonlyMap<string, Layer> = new Map(
  BUILTIN_LAYERS.map((layer) => [layer.id, layer]),
);

export const BUILTIN_LAYER_IDS: string[] = BUILTIN_LAYERS.map((l) => l.id);
