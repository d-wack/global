"use client";

import { useState, type FormEvent } from "react";

import type { PendingPoint } from "@/state/atlas-context";
import {
  EVENT_CATEGORIES,
  type EventCategory,
  type NewEventInput,
} from "@/types/event";

const LABELS: Record<EventCategory, string> = {
  news: "News",
  event: "Event",
  historical: "Historical",
};

/**
 * Small form shown after the user clicks the map in add-mode. Presentational:
 * it composes a NewEventInput (fields + the clicked point) and hands it to
 * onSubmit; the parent performs the POST.
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
  const [category, setCategory] = useState<EventCategory>("news");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        lng: point.lng,
        lat: point.lat,
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
      className="absolute bottom-20 left-1/2 z-20 w-80 max-w-[85vw] -translate-x-1/2 space-y-2 rounded-lg border border-white/10 bg-black/85 p-3 shadow-xl backdrop-blur"
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
      <select
        aria-label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value as EventCategory)}
        className={field}
      >
        {EVENT_CATEGORIES.map((c) => (
          <option key={c} value={c} className="bg-black">
            {LABELS[c]}
          </option>
        ))}
      </select>
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
