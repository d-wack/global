import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlacesView, formatViewLabel } from "@/components/places/places-view";
import type { UserView } from "@/types/view";

const view: UserView = {
  id: "v1",
  lng: -82.53,
  lat: 27.94,
  zoom: 11.6,
  year: 1865,
  createdAt: "2026-07-08T00:00:00.000Z",
};

describe("formatViewLabel", () => {
  it("rounds coords/zoom and labels the year", () => {
    expect(formatViewLabel(view)).toBe("27.9,-82.5 · z12 · 1865 CE");
  });
});

describe("PlacesView", () => {
  it("shows an inviting empty state when there are no views", () => {
    render(<PlacesView views={[]} loading={false} onSelect={() => {}} />);
    expect(screen.getByText(/Nowhere yet/i)).toBeInTheDocument();
  });

  it("shows a loading hint while fetching an empty history", () => {
    render(<PlacesView views={[]} loading onSelect={() => {}} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders a row per view and flies back on click", () => {
    const onSelect = vi.fn();
    render(<PlacesView views={[view]} loading={false} onSelect={onSelect} />);

    const row = screen.getByRole("button", {
      name: "Fly to 27.9,-82.5 · z12 · 1865 CE",
    });
    fireEvent.click(row);
    expect(onSelect).toHaveBeenCalledWith(view);
  });
});
