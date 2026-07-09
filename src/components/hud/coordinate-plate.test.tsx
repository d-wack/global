import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { CoordinatePlate } from "@/components/hud/coordinate-plate";
import { AtlasProvider, useAtlas } from "@/state/atlas-context";

function SetView() {
  const { setView } = useAtlas();
  return (
    <button
      type="button"
      onClick={() => setView({ lng: -74.006, lat: 40.7128, zoom: 4.25 })}
    >
      set-view
    </button>
  );
}

function renderWithProvider(children: ReactNode) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) }),
  );
  return render(<AtlasProvider>{children}</AtlasProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CoordinatePlate", () => {
  it("shows dashes before the map reports a viewport", () => {
    const { container } = renderWithProvider(<CoordinatePlate />);
    const text = container.textContent ?? "";
    // Both LAT and LNG placeholders, plus the zoom placeholder.
    expect(text.match(/--\.--°/g)).toHaveLength(2);
    expect(text).toContain("Z --");
  });

  it("formats lat/lng/zoom at 2 decimals once a view exists", () => {
    const { container } = renderWithProvider(
      <>
        <SetView />
        <CoordinatePlate />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "set-view" }));
    const text = container.textContent ?? "";
    expect(text).toContain("40.71° N");
    expect(text).toContain("74.01° W");
    expect(text).toContain("Z 4.25");
  });
});
