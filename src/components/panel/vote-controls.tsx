"use client";

import { cn } from "@/lib/utils";
import type { VoteDirection } from "@/types/event";

/** Up/down vote buttons with the net score between them. */
export function VoteControls({
  votes,
  onVote,
  disabled = false,
}: {
  votes: number;
  onVote: (direction: VoteDirection) => void;
  disabled?: boolean;
}) {
  const button =
    "flex h-5 w-5 items-center justify-center rounded text-white/50 transition-colors hover:text-emerald-300 disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5">
      <button
        type="button"
        aria-label="Vote up"
        disabled={disabled}
        onClick={() => onVote("up")}
        className={cn(button)}
      >
        ▲
      </button>
      <span
        aria-label="Net votes"
        className={cn(
          "font-mono text-xs tabular-nums",
          votes > 0
            ? "text-emerald-300"
            : votes < 0
              ? "text-red-400"
              : "text-white/50",
        )}
      >
        {votes}
      </span>
      <button
        type="button"
        aria-label="Vote down"
        disabled={disabled}
        onClick={() => onVote("down")}
        className={cn(button)}
      >
        ▼
      </button>
    </div>
  );
}
