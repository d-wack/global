import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TimeControl } from "@/components/widget/time-control";

describe("TimeControl", () => {
  it("shows the current as-of year", () => {
    render(<TimeControl year={2026} maxYear={2026} onChange={() => {}} />);
    expect(screen.getByText("As of 2026 CE")).toBeInTheDocument();
  });

  it("applies a relative jump", () => {
    const onChange = vi.fn();
    render(<TimeControl year={2026} maxYear={2026} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "−1000y" }));
    expect(onChange).toHaveBeenCalledWith(1026);
  });

  it("takes an absolute year (BCE-capable)", () => {
    const onChange = vi.fn();
    render(<TimeControl year={2026} maxYear={2026} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "absolute" }));
    fireEvent.change(screen.getByLabelText("Year"), {
      target: { value: "-500" },
    });
    expect(onChange).toHaveBeenCalledWith(-500);
  });

  it("clamps below the timeline floor", () => {
    const onChange = vi.fn();
    render(<TimeControl year={2026} maxYear={2026} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "absolute" }));
    fireEvent.change(screen.getByLabelText("Year"), {
      target: { value: "-99999" },
    });
    expect(onChange).toHaveBeenCalledWith(-3000);
  });
});
