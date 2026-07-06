import type { StyleSpecification } from "maplibre-gl";

/**
 * Basemap + initial-view configuration — the single tiles seam.
 *
 * Today: CARTO "dark matter" raster tiles (keyless, dark "situation-room"
 * look). Later phases swap this constant for self-hosted vector tiles (PMTiles)
 * or a keyed provider (MapTiler) without touching the map component.
 */

const CARTO_DARK_TILES = [
  "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
];

const CARTO_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>';

export const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  // Globe projection is a v5 feature; setting it in the style makes the map a
  // 3D globe when zoomed out and flattens toward a mercator plane when zoomed in.
  projection: { type: "globe" },
  sources: {
    carto: {
      type: "raster",
      tiles: CARTO_DARK_TILES,
      tileSize: 256,
      attribution: CARTO_ATTRIBUTION,
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#000000" },
    },
    { id: "carto", type: "raster", source: "carto" },
  ],
};

/** Where the globe starts before the user moves it. */
export const INITIAL_VIEW = {
  center: [10, 25] as [number, number],
  zoom: 1.4,
  pitch: 0,
  bearing: 0,
};

/** Marker fill per category — keeps the map and panel legend in sync. */
export const CATEGORY_COLORS: Record<string, string> = {
  news: "#38bdf8", // sky
  event: "#a78bfa", // violet
  historical: "#fbbf24", // amber
};
