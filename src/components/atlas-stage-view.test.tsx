import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
const toggle = <button type="button">toggle</button>;

describe("AtlasStageView", () => {
  it("hides every overlay but keeps the globe and toggle in immersive mode", () => {
    // No provider needed: with the chrome hidden, no overlay mounts to read it.
    render(
      <AtlasStageView chromeVisible={false} globe={globe} toggle={toggle} />,
    );

    expect(screen.getByTestId("globe")).toBeTruthy();
    expect(screen.getByRole("button", { name: "toggle" })).toBeTruthy();
    // The left events panel and the timeline scrubber are gone.
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.queryByText("PLANET ATLAS")).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("renders the overlays when the chrome is visible", () => {
    stubFetch();
    render(
      <AtlasStageView chromeVisible={true} globe={globe} toggle={toggle} />,
      {
        wrapper: provider,
      },
    );

    expect(screen.getByText("PLANET ATLAS")).toBeTruthy();
    expect(screen.getByRole("complementary")).toBeTruthy();
    vi.unstubAllGlobals();
  });
});
