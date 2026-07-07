import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { ToolBar } from "@/components/toolbar/tool-bar";
import { AtlasProvider } from "@/state/atlas-context";

function renderToolBar() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) }),
  );
  function Wrapper({ children }: { children: ReactNode }) {
    return <AtlasProvider>{children}</AtlasProvider>;
  }
  return render(<ToolBar />, { wrapper: Wrapper });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ToolBar", () => {
  it("starts on Explore and switches the active tool", () => {
    renderToolBar();
    const explore = screen.getByRole("button", { name: /Explore/ });
    const inspect = screen.getByRole("button", { name: /Inspect/ });

    expect(explore).toHaveAttribute("aria-pressed", "true");
    expect(inspect).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(inspect);
    expect(inspect).toHaveAttribute("aria-pressed", "true");
    expect(explore).toHaveAttribute("aria-pressed", "false");
  });
});
