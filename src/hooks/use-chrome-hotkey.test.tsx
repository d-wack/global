import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { isEditableTarget, useChromeHotkey } from "@/hooks/use-chrome-hotkey";
import { AtlasProvider, useAtlas } from "@/state/atlas-context";

function wrapper({ children }: { children: ReactNode }) {
  return <AtlasProvider>{children}</AtlasProvider>;
}

function stubFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) }),
  );
}

/** Mounts the hotkey and exposes the current chrome visibility for assertions. */
function useProbe() {
  useChromeHotkey();
  return useAtlas().chromeVisible;
}

function pressH(target: EventTarget = document.body) {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key: "h", bubbles: true }),
    );
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe("isEditableTarget", () => {
  it("flags inputs, textareas, selects and contenteditable", () => {
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const select = document.createElement("select");
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(textarea)).toBe(true);
    expect(isEditableTarget(select)).toBe(true);
    expect(isEditableTarget(editable)).toBe(true);
  });

  it("does not flag plain elements or null", () => {
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe("useChromeHotkey", () => {
  it("toggles the chrome on H when nothing editable is focused", () => {
    stubFetch();
    const { result } = renderHook(useProbe, { wrapper });
    expect(result.current).toBe(true);

    pressH();
    expect(result.current).toBe(false);

    pressH();
    expect(result.current).toBe(true);
  });

  it("ignores H aimed at an input so typing is never hijacked", () => {
    stubFetch();
    const input = document.createElement("input");
    document.body.appendChild(input);

    const { result } = renderHook(useProbe, { wrapper });
    expect(result.current).toBe(true);

    pressH(input);
    expect(result.current).toBe(true);
  });

  it("restores the chrome on Escape only while it is hidden", () => {
    stubFetch();
    const { result } = renderHook(useProbe, { wrapper });

    const pressEscape = () =>
      act(() => {
        document.body.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      });

    // Escape is a no-op while the chrome is already shown.
    pressEscape();
    expect(result.current).toBe(true);

    // Hide via H, then Escape restores.
    pressH();
    expect(result.current).toBe(false);
    pressEscape();
    expect(result.current).toBe(true);
  });
});
