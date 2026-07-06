import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlaceInfoView } from "@/components/inspect/place-info-view";
import type { PlaceInfoState } from "@/hooks/use-place-info";

const base: PlaceInfoState = {
  point: { lat: 41.8925, lng: 12.4853 },
  loading: false,
  error: null,
  results: [
    {
      pageId: 1,
      title: "Roman Forum",
      distanceMeters: 120,
      lat: 41.8925,
      lng: 12.4853,
      description: "archaeological site in Rome",
      extract: "The Roman Forum is a rectangular plaza in Rome.",
      url: "https://en.wikipedia.org/wiki/Roman_Forum",
    },
  ],
};

describe("PlaceInfoView", () => {
  it("shows the point and each nearby article with its distance", () => {
    render(<PlaceInfoView placeInfo={base} onClose={() => {}} />);
    expect(screen.getByText(/41\.8925, 12\.4853/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Roman Forum" }),
    ).toBeInTheDocument();
    expect(screen.getByText("120 m")).toBeInTheDocument();
    expect(screen.getByText("archaeological site in Rome")).toBeInTheDocument();
  });

  it("expands the intro extract when a row is clicked", () => {
    render(<PlaceInfoView placeInfo={base} onClose={() => {}} />);
    expect(screen.queryByText(/rectangular plaza/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("heading", { name: "Roman Forum" }));
    expect(screen.getByText(/rectangular plaza/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Read on Wikipedia/ }),
    ).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Roman_Forum");
  });

  it("shows a loading state and calls onClose", () => {
    const onClose = vi.fn();
    render(
      <PlaceInfoView
        placeInfo={{ ...base, loading: true, results: [] }}
        onClose={onClose}
      />,
    );
    expect(screen.getByText(/Searching Wikipedia/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
