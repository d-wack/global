"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import maplibregl, { type Map as MlMap, type Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";

import { BASEMAP_STYLE, CATEGORY_COLORS, INITIAL_VIEW } from "@/config/map";
import { useAtlas } from "@/state/atlas-context";

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
        attributionControl: { compact: true },
      });
    } catch (err) {
      // e.g. no WebGL available. The panel/search still work (bounds stay null,
      // so the panel shows all events); just skip the map.
      console.error("Failed to initialize the map", err);
      return;
    }
    mapRef.current = map;
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
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
      if (atlasRef.current.addMode) {
        atlasRef.current.setPendingPoint({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
        });
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

    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, []);

  // Reflect add-mode in the cursor.
  useEffect(() => {
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = atlas.addMode ? "crosshair" : "";
  }, [atlas.addMode]);

  // Sync markers to the current events (diff by id).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    const seen = new Set<string>();

    for (const event of atlas.events) {
      seen.add(event.id);
      if (markers.has(event.id)) continue;
      const el = document.createElement("div");
      el.className = "atlas-marker";
      el.style.background = CATEGORY_COLORS[event.category] ?? "#38bdf8";
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
  }, [atlas.events]);

  // Size with h-full/w-full, not `absolute inset-0`: maplibre-gl.css forces
  // `position: relative` on its container, which cancels inset-based stretching
  // and collapses the element to 0 height (a black map).
  return (
    <div ref={containerRef} className="h-full w-full" data-testid="globe" />
  );
}
