import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CollapsibleSection } from "@/components/widget/collapsible-section";

describe("CollapsibleSection", () => {
  it("shows its title and content when open by default", () => {
    render(
      <CollapsibleSection title="LAYERS">
        <p>content</p>
      </CollapsibleSection>,
    );
    expect(screen.getByRole("button", { name: /LAYERS/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("collapses and expands on click", () => {
    render(
      <CollapsibleSection title="TIME" defaultOpen={false}>
        <p>content</p>
      </CollapsibleSection>,
    );
    expect(screen.queryByText("content")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /TIME/ }));
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
