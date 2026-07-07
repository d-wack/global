import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LayerChooser } from "@/components/panel/layer-chooser";
import { BUILTIN_LAYERS } from "@/config/layers";

describe("LayerChooser", () => {
  it("renders a chip per layer plus the add stub", () => {
    render(
      <LayerChooser
        layers={BUILTIN_LAYERS}
        active={new Set()}
        onToggle={() => {}}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(
      BUILTIN_LAYERS.length + 1,
    );
  });

  it("marks active vs inactive via aria-pressed", () => {
    render(
      <LayerChooser
        layers={BUILTIN_LAYERS}
        active={new Set(["news"])}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /News/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Historical/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onToggle with the layer id", () => {
    const onToggle = vi.fn();
    render(
      <LayerChooser
        layers={BUILTIN_LAYERS}
        active={new Set()}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Events/ }));
    expect(onToggle).toHaveBeenCalledWith("event");
  });
});
