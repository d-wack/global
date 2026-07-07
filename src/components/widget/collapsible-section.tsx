"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A titled, collapsible section — the building block for the dockable panels
 * (Photoshop/Blender feel). Stack several inside a panel/widget.
 */
export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-white/10 last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left font-mono text-[10px] tracking-[0.2em] text-emerald-400/70 hover:text-emerald-300"
      >
        {title}
        <span
          aria-hidden
          className={cn("transition-transform", open && "rotate-90")}
        >
          ▸
        </span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </section>
  );
}
