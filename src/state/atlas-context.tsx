"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { BUILTIN_LAYERS } from "@/config/layers";
import { useEvents, type UseEvents } from "@/hooks/use-events";
import { usePlaceInfo, type UsePlaceInfo } from "@/hooks/use-place-info";
import type { Bounds } from "@/lib/viewport";

export interface PendingPoint {
  lng: number;
  lat: number;
}

/** Live map center + zoom, for the instrument readout. */
export interface MapView {
  lng: number;
  lat: number;
  zoom: number;
}

/** The active map tool: pan/explore, drop-an-event, or inspect-a-coordinate. */
export type ToolId = "explore" | "add" | "inspect";

type FlyToBounds = (bbox: [number, number, number, number]) => void;

export interface AtlasContextValue extends UseEvents, UsePlaceInfo {
  /** Current map viewport, or null until the map first settles. */
  bounds: Bounds | null;
  setBounds: (bounds: Bounds) => void;
  /** Live center/zoom, updated continuously as the map moves. */
  view: MapView | null;
  setView: (view: MapView) => void;
  /** Ids of layers currently shown; an event displays if any of its layers is here. */
  activeLayerIds: Set<string>;
  toggleLayer: (layerId: string) => void;
  search: string;
  setSearch: (query: string) => void;
  /** As-of year selected on the timeline; events with year > this are hidden. */
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  activeTool: ToolId;
  /** Switch tool; clears transient tool state (pending add point) on change. */
  setActiveTool: (tool: ToolId) => void;
  /** Where the user clicked in add-mode, awaiting the form; null otherwise. */
  pendingPoint: PendingPoint | null;
  setPendingPoint: (point: PendingPoint | null) => void;
  /** The map registers its imperative fly-to here; the search box calls it. */
  registerFlyTo: (fn: FlyToBounds) => void;
  flyToBounds: FlyToBounds;
}

const AtlasContext = createContext<AtlasContextValue | null>(null);

export function AtlasProvider({ children }: { children: ReactNode }) {
  const eventsApi = useEvents();
  const placeInfoApi = usePlaceInfo();
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [activeLayerIds, setActiveLayerIds] = useState<Set<string>>(
    () =>
      new Set(BUILTIN_LAYERS.filter((l) => l.defaultVisible).map((l) => l.id)),
  );
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [activeTool, setActiveToolState] = useState<ToolId>("explore");
  const [pendingPoint, setPendingPoint] = useState<PendingPoint | null>(null);
  const flyToRef = useRef<FlyToBounds | null>(null);

  const toggleLayer = useCallback((layerId: string) => {
    setActiveLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  }, []);

  const { clearPlaceInfo } = placeInfoApi;
  const setActiveTool = useCallback(
    (tool: ToolId) => {
      setActiveToolState(tool);
      // Switching tools discards each tool's transient state.
      if (tool !== "add") setPendingPoint(null);
      if (tool !== "inspect") clearPlaceInfo();
    },
    [clearPlaceInfo],
  );

  const registerFlyTo = useCallback((fn: FlyToBounds) => {
    flyToRef.current = fn;
  }, []);

  const flyToBounds = useCallback<FlyToBounds>((bbox) => {
    flyToRef.current?.(bbox);
  }, []);

  const value = useMemo<AtlasContextValue>(
    () => ({
      ...eventsApi,
      ...placeInfoApi,
      bounds,
      setBounds,
      view,
      setView,
      activeLayerIds,
      toggleLayer,
      search,
      setSearch,
      selectedYear,
      setSelectedYear,
      activeTool,
      setActiveTool,
      pendingPoint,
      setPendingPoint,
      registerFlyTo,
      flyToBounds,
    }),
    [
      eventsApi,
      placeInfoApi,
      bounds,
      view,
      activeLayerIds,
      toggleLayer,
      search,
      selectedYear,
      activeTool,
      setActiveTool,
      pendingPoint,
      registerFlyTo,
      flyToBounds,
    ],
  );

  return (
    <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>
  );
}

export function useAtlas(): AtlasContextValue {
  const ctx = useContext(AtlasContext);
  if (!ctx) throw new Error("useAtlas must be used within an AtlasProvider");
  return ctx;
}
