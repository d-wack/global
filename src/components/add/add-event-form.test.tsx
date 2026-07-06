import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AddEventForm } from "@/components/add/add-event-form";

const point = { lng: 2.35, lat: 48.85 };

describe("AddEventForm", () => {
  it("shows the clicked coordinates", () => {
    render(
      <AddEventForm point={point} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(screen.getByText("48.8500, 2.3500")).toBeInTheDocument();
  });

  it("keeps submit disabled until a title is entered", () => {
    render(
      <AddEventForm point={point} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Add event" })).toBeDisabled();
  });

  it("submits the entered fields with the point coordinates", () => {
    const onSubmit = vi.fn();
    render(
      <AddEventForm point={point} onSubmit={onSubmit} onCancel={() => {}} />,
    );

    fireEvent.change(screen.getByLabelText("Event title"), {
      target: { value: "New thing" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Details" },
    });
    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "event" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add event" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "New thing",
      description: "Details",
      category: "event",
      lng: 2.35,
      lat: 48.85,
    });
  });

  it("calls onCancel", () => {
    const onCancel = vi.fn();
    render(
      <AddEventForm point={point} onSubmit={() => {}} onCancel={onCancel} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
