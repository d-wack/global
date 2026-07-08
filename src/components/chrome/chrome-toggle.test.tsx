import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChromeToggle } from "./chrome-toggle";

describe("ChromeToggle", () => {
  it("labels itself for hiding and is unpressed when the chrome is shown", () => {
    render(<ChromeToggle chromeVisible={true} onToggle={() => {}} />);
    const button = screen.getByRole("button", { name: "Hide interface" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("labels itself for restoring and is pressed when the chrome is hidden", () => {
    render(<ChromeToggle chromeVisible={false} onToggle={() => {}} />);
    const button = screen.getByRole("button", { name: "Show interface" });
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(<ChromeToggle chromeVisible={true} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
