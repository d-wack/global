"use client";

import { useState, type FormEvent } from "react";

import { BUILTIN_LAYERS } from "@/config/layers";
import { cn } from "@/lib/utils";
import type { PendingPoint } from "@/state/atlas-context";
import type { NewEventInput } from "@/types/event";

/**
 * Small form shown after the user clicks the map in add-mode. Presentational:
 * it composes a NewEventInput (fields + the clicked point) and hands it to
 * onSubmit; the parent performs the POST. An event may belong to several layers.
 */
export function AddEventForm({
  point,
  onSubmit,
  onCancel,
}: {
  point: PendingPoint;
  onSubmit: (input: NewEventInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [layerIds, setLayerIds] = useState<string[]>(["news"]);
  // Occurred year, defaulting to the current year (out of render, to stay pure).
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    title.trim().length > 0 &&
    layerIds.length > 0 &&
    Number.isFinite(year) &&
    !submitting;

  const toggleLayer = (id: string) =>
    setLayerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        layerIds,
        lng: point.lng,
        lat: point.lat,
        year,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    "w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/40";

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Add event"
      className="absolute bottom-28 left-1/2 z-40 w-80 max-w-[85vw] -translate-x-1/2 space-y-2 rounded-lg border border-white/10 bg-black/85 p-3 shadow-xl backdrop-blur"
    >
      <p className="font-mono text-[11px] text-emerald-300/70">
        {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
      </p>
      <input
        aria-label="Event title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className={field}
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Layers">
        {BUILTIN_LAYERS.map((layer) => {
          const on = layerIds.includes(layer.id);
          return (
            <button
              key={layer.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggleLayer(layer.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                on
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 text-white/40",
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: layer.color }}
              />
              {layer.name}
            </button>
          );
        })}
      </div>
      <input
        aria-label="Year"
        type="number"
        value={year}
        onChange={(e) => setYear(e.target.valueAsNumber)}
        placeholder="Year (negative = BCE)"
        className={field}
      />
      <textarea
        aria-label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className={field}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm text-white/60 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-emerald-400 px-3 py-1.5 text-sm font-medium text-black disabled:opacity-40"
        >
          Add event
        </button>
      </div>
    </form>
  );
}
