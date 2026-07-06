import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AtlasProvider tool switching", () => {
  it("clears the pending add point when leaving the add tool", () => {
    stubFetch();
    const { result } = renderHook(() => useAtlas(), { wrapper });

    act(() => result.current.setActiveTool("add"));
    act(() => result.current.setPendingPoint({ lng: 1, lat: 2 }));
    expect(result.current.pendingPoint).toEqual({ lng: 1, lat: 2 });

    act(() => result.current.setActiveTool("explore"));
    expect(result.current.activeTool).toBe("explore");
    expect(result.current.pendingPoint).toBeNull();
  });

  it("keeps the pending point while staying on the add tool", () => {
    stubFetch();
    const { result } = renderHook(() => useAtlas(), { wrapper });

    act(() => result.current.setActiveTool("add"));
    act(() => result.current.setPendingPoint({ lng: 3, lat: 4 }));
    act(() => result.current.setActiveTool("add"));
    expect(result.current.pendingPoint).toEqual({ lng: 3, lat: 4 });
  });
});
