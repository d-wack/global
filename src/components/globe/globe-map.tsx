"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import maplibregl, { type Map as MlMap, type Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";

import { BASEMAP_STYLE, INITIAL_VIEW } from "@/config/map";
import { applyLayerFilter, resolveMarkerStyle } from "@/lib/layers";
import { filterAsOf } from "@/lib/timeline";
import { filterVisible } from "@/lib/viewport";
import { useAtlas } from "@/state/atlas-context";
import type { MarkerShape } from "@/types/layer";

/**
 * Style a marker's inner shape element. The wrapper (positioned by MapLibre)
 * stays transform-free so the diamond's rotation can't fight MapLibre's
 * translate. `sig` (shape|color) is cached on the wrapper to skip redundant work.
 */
function styleMarker(
  el: HTMLElement,
  shape: MarkerShape,
  color: string,
  sig: string,
): void {
  const inner = el.firstElementChild as HTMLElement | null;
  if (!inner) return;
  inner.className = `atlas-marker__shape atlas-marker__shape--${shape}`;
  inner.style.background = color;
  el.dataset.sig = sig;
}

/**
 * The MapLibre globe. Loaded via next/dynamic with `ssr: false`, so this module
 * (and MapLibre) never runs on the server. The map instance lives in a ref, not
 * React state; markers are managed imperatively (the idiomatic MapLibre pattern).
 * Latest context handlers are read through a ref so the init effect runs once.
 */
export default function GlobeMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());

  const atlas = useAtlas();
  const atlasRef = useRef(atlas);
  // Keep the ref pointing at the latest context so the once-only init effect
  // (below) always reads current handlers without re-subscribing.
  useEffect(() => {
    atlasRef.current = atlas;
  });

  // Initialize the map exactly once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const markers = markersRef.current;

    let map: MlMap;
    try {
      map = new maplibregl.Map({
        container,
        style: BASEMAP_STYLE,
        center: INITIAL_VIEW.center,
        zoom: INITIAL_VIEW.zoom,
        pitch: INITIAL_VIEW.pitch,
        bearing: INITIAL_VIEW.bearing,
        // Add attribution ourselves (top-right) so the bottom timeline can't hide it.
        attributionControl: false,
      });
    } catch (err) {
      // e.g. no WebGL available. The panel/search still work (bounds stay null,
      // so the panel shows all events); just skip the map.
      console.error("Failed to initialize the map", err);
      return;
    }
    mapRef.current = map;
    // Zoom control top-left (above the left panel); attribution stays bottom-right.
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-left",
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    const emitView = () => {
      const c = map.getCenter();
      atlasRef.current.setView({ lng: c.lng, lat: c.lat, zoom: map.getZoom() });
    };
    const emitBounds = () => {
      const b = map.getBounds();
      atlasRef.current.setBounds({
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      });
    };

    map.on("load", () => {
      emitView();
      emitBounds();
    });
    map.on("move", emitView);
    map.on("moveend", emitBounds);
    map.on("click", (e) => {
      const tool = atlasRef.current.activeTool;
      if (tool === "add") {
        atlasRef.current.setPendingPoint({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
        });
      } else if (tool === "inspect") {
        void atlasRef.current.inspectAt(e.lngLat.lat, e.lngLat.lng);
      }
    });

    atlasRef.current.registerFlyTo((bbox) => {
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { padding: 80, duration: 1200, maxZoom: 12 },
      );
    });

    atlasRef.current.registerFlyToView((center, zoom) => {
      map.flyTo({ center: [center.lng, center.lat], zoom, duration: 1200 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, []);

  // A targeting cursor while a click-tool (add / inspect) is active.
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      map.getCanvas().style.cursor =
        atlas.activeTool === "explore" ? "" : "crosshair";
    }
  }, [atlas.activeTool]);

  // Sync markers to the events visible in the current viewport at the selected
  // year AND active layers (diff by id; restyle in place when an event's
  // winning layer changes). Bounds narrow the set to what's on screen; when
  // bounds are null (pre-first-settle) we show every in-year/in-layer event.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    const seen = new Set<string>();

    const inYearLayer = applyLayerFilter(
      filterAsOf(atlas.events, atlas.selectedYear),
      atlas.activeLayerIds,
    );
    // TODO(P3): scale filter by event.z once events carry a z relevance band.
    const visible = atlas.bounds
      ? filterVisible(inYearLayer, atlas.bounds)
      : inYearLayer;

    for (const event of visible) {
      seen.add(event.id);
      const style = resolveMarkerStyle(event, atlas.activeLayerIds);
      const sig = `${style.shape}|${style.color}`;

      const existing = markers.get(event.id);
      if (existing) {
        const el = existing.getElement();
        if (el.dataset.sig !== sig)
          styleMarker(el, style.shape, style.color, sig);
        continue;
      }

      const el = document.createElement("div");
      el.className = "atlas-marker";
      el.appendChild(document.createElement("div"));
      styleMarker(el, style.shape, style.color, sig);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([event.lng, event.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText(event.title))
        .addTo(map);
      markers.set(event.id, marker);
    }

    for (const [id, marker] of markers) {
      if (!seen.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }
  }, [atlas.events, atlas.selectedYear, atlas.activeLayerIds, atlas.bounds]);

  // Size with h-full/w-full, not `absolute inset-0`: maplibre-gl.css forces
  // `position: relative` on its container, which cancels inset-based stretching
  // and collapses the element to 0 height (a black map).
  return (
    <div ref={containerRef} className="h-full w-full" data-testid="globe" />
  );
}
