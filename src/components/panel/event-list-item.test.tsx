import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventListItem } from "@/components/panel/event-list-item";
import type { AtlasEvent } from "@/types/event";

const event: AtlasEvent = {
  id: "e1",
  title: "Maglev line opens",
  description: "First commercial segment",
  category: "news",
  lng: 139.7,
  lat: 35.7,
  votes: 12,
  createdAt: "2026-07-05T21:30:00.000Z",
};

describe("EventListItem", () => {
  it("renders the title, description, and votes", () => {
    render(
      <ul>
        <EventListItem event={event} onVote={() => {}} />
      </ul>,
    );
    expect(
      screen.getByRole("heading", { name: "Maglev line opens" }),
    ).toBeInTheDocument();
    expect(screen.getByText("First commercial segment")).toBeInTheDocument();
    expect(screen.getByLabelText("Net votes")).toHaveTextContent("12");
  });

  it("forwards vote clicks", () => {
    const onVote = vi.fn();
    render(
      <ul>
        <EventListItem event={event} onVote={onVote} />
      </ul>,
    );
    fireEvent.click(screen.getByLabelText("Vote up"));
    expect(onVote).toHaveBeenCalledWith("up");
  });
});
