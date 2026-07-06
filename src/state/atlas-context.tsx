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

import { useEvents, type UseEvents } from "@/hooks/use-events";
import type { Bounds } from "@/lib/viewport";
import { EVENT_CATEGORIES, type EventCategory } from "@/types/event";

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

type FlyToBounds = (bbox: [number, number, number, number]) => void;

export interface AtlasContextValue extends UseEvents {
  /** Current map viewport, or null until the map first settles. */
  bounds: Bounds | null;
  setBounds: (bounds: Bounds) => void;
  /** Live center/zoom, updated continuously as the map moves. */
  view: MapView | null;
  setView: (view: MapView) => void;
  activeCategories: Set<EventCategory>;
  toggleCategory: (category: EventCategory) => void;
  search: string;
  setSearch: (query: string) => void;
  addMode: boolean;
  setAddMode: (enabled: boolean) => void;
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
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(
    () => new Set(EVENT_CATEGORIES),
  );
  const [search, setSearch] = useState("");
  const [addMode, setAddMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<PendingPoint | null>(null);
  const flyToRef = useRef<FlyToBounds | null>(null);

  const toggleCategory = useCallback((category: EventCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const registerFlyTo = useCallback((fn: FlyToBounds) => {
    flyToRef.current = fn;
  }, []);

  const flyToBounds = useCallback<FlyToBounds>((bbox) => {
    flyToRef.current?.(bbox);
  }, []);

  const value = useMemo<AtlasContextValue>(
    () => ({
      ...eventsApi,
      bounds,
      setBounds,
      view,
      setView,
      activeCategories,
      toggleCategory,
      search,
      setSearch,
      addMode,
      setAddMode,
      pendingPoint,
      setPendingPoint,
      registerFlyTo,
      flyToBounds,
    }),
    [
      eventsApi,
      bounds,
      view,
      activeCategories,
      toggleCategory,
      search,
      addMode,
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
