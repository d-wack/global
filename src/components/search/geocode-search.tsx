"use client";

import { useEffect, useRef, useState } from "react";

import type { GeocodeResult } from "@/server/geocode/geocoder";
import { useAtlas } from "@/state/atlas-context";

const DEBOUNCE_MS = 300;
const MIN_QUERY = 2;

/**
 * Typed place search: debounced GET /api/geocode, then fly the map to the chosen
 * result's bounding box (scale matches the place). Debouncing is done in the
 * change handler via a timer ref, so state is only set from handlers/timeouts.
 */
export function GeocodeSearch() {
  const { flyToBounds } = useAtlas();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onChange = (value: string) => {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);

    const q = value.trim();
    if (q.length < MIN_QUERY) {
      setResults([]);
      setOpen(false);
      return;
    }

    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("geocode failed");
        const json = (await res.json()) as { results: GeocodeResult[] };
        setResults(json.results);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, DEBOUNCE_MS);
  };

  const select = (result: GeocodeResult) => {
    flyToBounds(result.bbox);
    setQuery(result.name);
    setOpen(false);
  };

  return (
    <div className="absolute top-3 left-1/2 z-10 w-72 max-w-[80vw] -translate-x-1/2">
      <input
        type="search"
        aria-label="Search for a place"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Fly to a place…"
        className="w-full rounded-md border border-white/10 bg-black/70 px-3 py-1.5 text-sm text-white backdrop-blur outline-none placeholder:text-white/30 focus:border-emerald-400/40"
      />
      {open && results.length > 0 && (
        <ul className="mt-1 max-h-64 overflow-y-auto rounded-md border border-white/10 bg-black/85 backdrop-blur">
          {results.map((result, i) => (
            <li key={`${result.name}-${i}`}>
              <button
                type="button"
                onClick={() => select(result)}
                className="block w-full truncate px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
              >
                {result.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
