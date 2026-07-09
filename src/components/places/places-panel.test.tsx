import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlacesPanel } from "@/components/places/places-panel";
import {
  AtlasProvider,
  useAtlas,
  type AtlasContextValue,
} from "@/state/atlas-context";
import type { UserView } from "@/types/view";

const view: UserView = {
  id: "v1",
  lng: -82.53,
  lat: 27.94,
  zoom: 11.6,
  year: 1865,
  createdAt: "2026-07-08T00:00:00.000Z",
};

/** Route fetch by URL: events empty, views as configured. */
function stubFetch(views: UserView[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const body = url.startsWith("/api/views") ? { views } : { events: [] };
      return Promise.resolve({ ok: true, json: async () => body });
    }),
  );
}

let ctx: AtlasContextValue | null = null;
function Probe() {
  const atlas = useAtlas();
  useEffect(() => {
    ctx = atlas;
  });
  return null;
}

function renderPanel(views: UserView[]) {
  stubFetch(views);
  return render(
    <AtlasProvider>
      <Probe />
      <PlacesPanel />
    </AtlasProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  ctx = null;
});

describe("PlacesPanel", () => {
  it("renders the section header and an empty history cleanly", async () => {
    renderPanel([]);
    fireEvent.click(
      screen.getByRole("button", { name: "PLACES I'VE VISITED" }),
    );
    expect(await screen.findByText(/Nowhere yet/i)).toBeInTheDocument();
  });

  it("lists recent views and flies back on click", async () => {
    renderPanel([view]);
    fireEvent.click(
      screen.getByRole("button", { name: "PLACES I'VE VISITED" }),
    );

    const flyToView = vi.fn();
    act(() => ctx!.registerFlyToView(flyToView));

    const row = await screen.findByRole("button", { name: /Fly to/ });
    fireEvent.click(row);

    expect(flyToView).toHaveBeenCalledWith({ lng: -82.53, lat: 27.94 }, 11.6);
    expect(ctx!.selectedYear).toBe(1865);
  });
});
