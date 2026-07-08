import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useUserContext, toUserContext } from "@/hooks/use-user-context";
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

describe("toUserContext", () => {
  it("returns null until the view settles", () => {
    expect(toUserContext(null, 1865)).toBeNull();
  });

  it("folds the view and year into one context value", () => {
    expect(toUserContext({ lng: -82.5, lat: 27.9, zoom: 12 }, 1865)).toEqual({
      lng: -82.5,
      lat: 27.9,
      zoom: 12,
      year: 1865,
    });
  });
});

describe("useUserContext", () => {
  it("is null before the map settles, then tracks view + year", () => {
    stubFetch();
    const { result } = renderHook(
      () => ({ atlas: useAtlas(), ctx: useUserContext() }),
      { wrapper },
    );

    expect(result.current.ctx).toBeNull();

    act(() => result.current.atlas.setView({ lng: 10, lat: 20, zoom: 5 }));
    act(() => result.current.atlas.setSelectedYear(1900));

    expect(result.current.ctx).toEqual({
      lng: 10,
      lat: 20,
      zoom: 5,
      year: 1900,
    });
  });
});
