import type { StyleSpecification } from "maplibre-gl";

/**
 * Basemap + initial-view configuration — the single tiles seam.
 *
 * Today: ESRI World Imagery satellite raster (keyless) for a photoreal
 * "Earth from orbit" look, with a globe atmosphere. Space itself is a CSS
 * starfield behind the (transparent) map. Later phases swap this constant for
 * self-hosted vector tiles (PMTiles) or a keyed provider without touching the
 * map component.
 */

const ESRI_IMAGERY_TILES = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
];

const ESRI_ATTRIBUTION =
  'Imagery © <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community';

export const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  // Globe projection is a v5 feature: a 3D globe when zoomed out, flattening
  // toward a mercator plane when zoomed in.
  projection: { type: "globe" },
  sources: {
    satellite: {
      type: "raster",
      tiles: ESRI_IMAGERY_TILES,
      tileSize: 256,
      maxzoom: 19,
      attribution: ESRI_ATTRIBUTION,
    },
  },
  // No opaque background layer — the space around the globe stays transparent so
  // the CSS starfield shows through.
  layers: [{ id: "satellite", type: "raster", source: "satellite" }],
  // Atmospheric halo + fade into space at the globe's edge.
  sky: {
    "sky-color": "#0a1330",
    "sky-horizon-blend": 0.6,
    "horizon-color": "#8ab4ff",
    "horizon-fog-blend": 0.6,
    "fog-color": "#0a1330",
    "fog-ground-blend": 0.2,
    "atmosphere-blend": [
      "interpolate",
      ["linear"],
      ["zoom"],
      0,
      0.9,
      6,
      0.4,
      10,
      0,
    ],
  },
};

/** Where the globe starts before the user moves it. */
export const INITIAL_VIEW = {
  center: [10, 25] as [number, number],
  zoom: 1.4,
  pitch: 0,
  bearing: 0,
};
