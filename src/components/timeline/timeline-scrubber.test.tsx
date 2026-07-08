import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TimelineScrubber } from "@/components/timeline/timeline-scrubber";

// Drive the scrubber through a mocked context so we can assert on writes and
// pin the displayed year without standing up the whole AtlasProvider.
const setSelectedYear = vi.fn();
let selectedYear = new Date().getFullYear();

vi.mock("@/state/atlas-context", () => ({
  useAtlas: () => ({ selectedYear, setSelectedYear }),
}));

afterEach(() => {
  setSelectedYear.mockClear();
  selectedYear = new Date().getFullYear();
});

describe("TimelineScrubber", () => {
  it("renders the temporal-lock readout with the current year and era", () => {
    render(<TimelineScrubber />);
    expect(screen.getByText("TEMPORAL LOCK")).toBeInTheDocument();
    expect(
      screen.getByText(String(new Date().getFullYear())),
    ).toBeInTheDocument();
    expect(screen.getByText("CE")).toBeInTheDocument();
  });

  it("labels the era bands from antiquity to modern", () => {
    render(<TimelineScrubber />);
    expect(screen.getByText("ANTIQUITY")).toBeInTheDocument();
    expect(screen.getByText("MODERN")).toBeInTheDocument();
  });

  it("exposes full slider ARIA", () => {
    render(<TimelineScrubber />);
    const slider = screen.getByRole("slider", { name: "Timeline year" });
    const now = new Date().getFullYear();
    expect(slider).toHaveAttribute("aria-valuemin", "-3000");
    expect(slider).toHaveAttribute("aria-valuemax", String(now));
    expect(slider).toHaveAttribute("aria-valuenow", String(now));
    expect(slider).toHaveAttribute("aria-valuetext", `${now} CE`);
  });

  it("steps back in time with the left arrow key", () => {
    render(<TimelineScrubber />);
    const slider = screen.getByRole("slider", { name: "Timeline year" });
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(setSelectedYear).toHaveBeenCalledTimes(1);
    expect(setSelectedYear.mock.calls[0]![0]).toBeLessThan(
      new Date().getFullYear(),
    );
  });

  it("jumps to the oldest year with Home", () => {
    render(<TimelineScrubber />);
    const slider = screen.getByRole("slider", { name: "Timeline year" });
    fireEvent.keyDown(slider, { key: "Home" });
    expect(setSelectedYear).toHaveBeenCalledWith(-3000);
  });

  it("writes the year on pointer drag", () => {
    render(<TimelineScrubber />);
    const slider = screen.getByRole("slider", { name: "Timeline year" });
    // jsdom has no layout; getBoundingClientRect returns zero width, so the
    // drag resolves to the oldest year — enough to prove the write path fires.
    slider.setPointerCapture = vi.fn();
    slider.releasePointerCapture = vi.fn();
    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 10 });
    expect(setSelectedYear).toHaveBeenCalled();
  });
});
