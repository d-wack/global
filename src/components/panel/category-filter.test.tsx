import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CategoryFilter } from "@/components/panel/category-filter";
import { EVENT_CATEGORIES } from "@/types/event";

describe("CategoryFilter", () => {
  it("renders a chip per category", () => {
    render(
      <CategoryFilter active={new Set(EVENT_CATEGORIES)} onToggle={() => {}} />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(EVENT_CATEGORIES.length);
  });

  it("marks active vs inactive chips via aria-pressed", () => {
    render(<CategoryFilter active={new Set(["news"])} onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: /News/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /History/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onToggle with the clicked category", () => {
    const onToggle = vi.fn();
    render(
      <CategoryFilter active={new Set(EVENT_CATEGORIES)} onToggle={onToggle} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Events/ }));
    expect(onToggle).toHaveBeenCalledWith("event");
  });
});
