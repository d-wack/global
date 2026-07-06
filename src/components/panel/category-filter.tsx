"use client";

import { CATEGORY_COLORS } from "@/config/map";
import { cn } from "@/lib/utils";
import { EVENT_CATEGORIES, type EventCategory } from "@/types/event";

const LABELS: Record<EventCategory, string> = {
  news: "News",
  event: "Events",
  historical: "History",
};

/** Toggle chips for the three categories; an inactive chip dims. */
export function CategoryFilter({
  active,
  onToggle,
}: {
  active: ReadonlySet<EventCategory>;
  onToggle: (category: EventCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {EVENT_CATEGORIES.map((category) => {
        const on = active.has(category);
        return (
          <button
            key={category}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(category)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-opacity",
              on
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-white/40 opacity-60 hover:opacity-100",
            )}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: CATEGORY_COLORS[category] }}
            />
            {LABELS[category]}
          </button>
        );
      })}
    </div>
  );
}
