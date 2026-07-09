import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { ToolColumn } from "@/components/hud/tool-column";
import { AtlasProvider } from "@/state/atlas-context";

function renderToolColumn() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) }),
  );
  function Wrapper({ children }: { children: ReactNode }) {
    return <AtlasProvider>{children}</AtlasProvider>;
  }
  return render(<ToolColumn />, { wrapper: Wrapper });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ToolColumn", () => {
  it("exposes a radiogroup of the three tools", () => {
    renderToolColumn();
    expect(screen.getByRole("radiogroup", { name: "Map tool" })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("starts on Explore and switches the checked tool", () => {
    renderToolColumn();
    const explore = screen.getByRole("radio", { name: "Explore" });
    const inspect = screen.getByRole("radio", { name: "Inspect" });

    expect(explore).toHaveAttribute("aria-checked", "true");
    expect(inspect).toHaveAttribute("aria-checked", "false");

    fireEvent.click(inspect);
    expect(inspect).toHaveAttribute("aria-checked", "true");
    expect(explore).toHaveAttribute("aria-checked", "false");
  });

  it("carries the immersive toggle, which hides the tools when pressed", () => {
    renderToolColumn();
    expect(screen.getAllByRole("radio")).toHaveLength(3);

    // The toggle offers to hide the interface while the chrome is shown.
    fireEvent.click(screen.getByRole("button", { name: "Hide interface" }));

    // In immersive mode the tools are gone; only the restore control remains.
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByRole("button", { name: "Show interface" })).toBeTruthy();
  });
});
