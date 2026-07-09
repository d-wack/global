import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { AtlasStageView } from "./atlas-stage-view";
import { AtlasProvider } from "@/state/atlas-context";

function stubFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) }),
  );
}

function provider({ children }: { children: ReactNode }) {
  return <AtlasProvider>{children}</AtlasProvider>;
}

const globe = <div data-testid="globe" />;

afterEach(() => vi.unstubAllGlobals());

describe("AtlasStageView", () => {
  it("renders the overlays and the toolbar when the chrome is visible", () => {
    stubFetch();
    render(<AtlasStageView globe={globe} />, { wrapper: provider });

    expect(screen.getByText("PLANET ATLAS")).toBeTruthy();
    expect(screen.getByRole("complementary")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Hide interface" })).toBeTruthy();
  });

  it("hides every overlay but keeps the globe and restore toggle in immersive mode", () => {
    stubFetch();
    render(<AtlasStageView globe={globe} />, { wrapper: provider });

    // Enter immersive mode via the toolbar's toggle.
    fireEvent.click(screen.getByRole("button", { name: "Hide interface" }));

    expect(screen.getByTestId("globe")).toBeTruthy();
    // The immersive toggle survives as the restore control.
    expect(screen.getByRole("button", { name: "Show interface" })).toBeTruthy();
    // Every gated overlay (panel, master widget, timeline) and the tools are gone.
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.queryByText("PLANET ATLAS")).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });
});
