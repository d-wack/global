"use client";

import { cn } from "@/lib/utils";
import type { VoteDirection } from "@/types/event";

/**
 * Up/down vote buttons with the net score between them. `userVote` highlights
 * the direction the requesting user has chosen (one vote per user; clicking the
 * same direction again toggles it off).
 */
export function VoteControls({
  votes,
  onVote,
  userVote = null,
  disabled = false,
}: {
  votes: number;
  onVote: (direction: VoteDirection) => void;
  userVote?: VoteDirection | null;
  disabled?: boolean;
}) {
  const button =
    "flex h-5 w-5 items-center justify-center rounded transition-colors disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5">
      <button
        type="button"
        aria-label="Vote up"
        aria-pressed={userVote === "up"}
        disabled={disabled}
        onClick={() => onVote("up")}
        className={cn(
          button,
          userVote === "up"
            ? "bg-emerald-400/15 text-emerald-300"
            : "text-white/50 hover:text-emerald-300",
        )}
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
        aria-pressed={userVote === "down"}
        disabled={disabled}
        onClick={() => onVote("down")}
        className={cn(
          button,
          userVote === "down"
            ? "bg-red-400/15 text-red-400"
            : "text-white/50 hover:text-emerald-300",
        )}
      >
        ▼
      </button>
    </div>
  );
}
