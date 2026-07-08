import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { TimelineStrip } from "@/components/hud/timeline-strip";
import { AtlasProvider } from "@/state/atlas-context";

function renderStrip() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) }),
  );
  function Wrapper({ children }: { children: ReactNode }) {
    return <AtlasProvider>{children}</AtlasProvider>;
  }
  return render(<TimelineStrip />, { wrapper: Wrapper });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TimelineStrip", () => {
  it("exposes a slider with full ARIA, starting at the present year", () => {
    renderStrip();
    const slider = screen.getByRole("slider", { name: "Timeline year" });
    const year = new Date().getFullYear();

    expect(slider).toHaveAttribute("aria-valuemin", "-3000");
    expect(slider).toHaveAttribute("aria-valuemax", String(year));
    expect(slider).toHaveAttribute("aria-valuenow", String(year));
    expect(slider).toHaveAttribute("aria-valuetext", `${year} CE`);
  });

  it("moves back in time with the left arrow key", () => {
    renderStrip();
    const slider = screen.getByRole("slider", { name: "Timeline year" });
    const start = Number(slider.getAttribute("aria-valuenow"));
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(Number(slider.getAttribute("aria-valuenow"))).toBeLessThan(start);
  });

  it("jumps to the oldest year with Home and the present with End", () => {
    renderStrip();
    const slider = screen.getByRole("slider", { name: "Timeline year" });
    fireEvent.keyDown(slider, { key: "Home" });
    expect(Number(slider.getAttribute("aria-valuenow"))).toBe(-3000);
    fireEvent.keyDown(slider, { key: "End" });
    expect(Number(slider.getAttribute("aria-valuenow"))).toBe(
      new Date().getFullYear(),
    );
  });
});
