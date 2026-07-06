import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { TimelineScrubber } from "@/components/timeline/timeline-scrubber";
import { AtlasProvider } from "@/state/atlas-context";

function renderScrubber() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) }),
  );
  function Wrapper({ children }: { children: ReactNode }) {
    return <AtlasProvider>{children}</AtlasProvider>;
  }
  return render(<TimelineScrubber />, { wrapper: Wrapper });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TimelineScrubber", () => {
  it("starts at the present year (as-of · all)", () => {
    renderScrubber();
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${year} CE`))).toBeInTheDocument();
    expect(screen.getByText(/all/)).toBeInTheDocument();
  });

  it("moves back in time with the left arrow key", () => {
    renderScrubber();
    const slider = screen.getByRole("slider", { name: "Timeline year" });
    const start = Number(slider.getAttribute("aria-valuenow"));
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    const after = Number(slider.getAttribute("aria-valuenow"));
    expect(after).toBeLessThan(start);
  });

  it("jumps to the oldest year with Home and back with reset", () => {
    renderScrubber();
    const slider = screen.getByRole("slider", { name: "Timeline year" });
    fireEvent.keyDown(slider, { key: "Home" });
    expect(Number(slider.getAttribute("aria-valuenow"))).toBe(-3000);
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(Number(slider.getAttribute("aria-valuenow"))).toBe(
      new Date().getFullYear(),
    );
  });
});
