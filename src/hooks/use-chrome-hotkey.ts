"use client";

import { useEffect } from "react";

import { useAtlas } from "@/state/atlas-context";

/**
 * True when a keystroke should be left for the focused control rather than
 * treated as a global shortcut — i.e. the user is typing into a field.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  // `isContentEditable` isn't implemented in jsdom, so fall back to the attribute.
  if (target.isContentEditable) return true;
  const editable = target.getAttribute("contenteditable");
  return editable === "" || editable === "true";
}

/**
 * Global keyboard shortcut for immersive mode. `H` toggles the overlay chrome;
 * `Esc` restores it when hidden. Ignores keystrokes with a modifier held or
 * aimed at an editable field (so typing in the search box is never hijacked).
 * Mount once, near the top of the tree.
 */
export function useChromeHotkey(): void {
  const { chromeVisible, toggleChrome } = useAtlas();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === "h") {
        event.preventDefault();
        toggleChrome();
      } else if (key === "escape" && !chromeVisible) {
        event.preventDefault();
        toggleChrome();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chromeVisible, toggleChrome]);
}
