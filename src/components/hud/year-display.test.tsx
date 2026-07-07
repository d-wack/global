import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { YearDisplay } from "@/components/hud/year-display";
import { AtlasProvider, useAtlas } from "@/state/atlas-context";

function SetYear({ year, label }: { year: number; label: string }) {
  const { setSelectedYear } = useAtlas();
  return (
    <button type="button" onClick={() => setSelectedYear(year)}>
      {label}
    </button>
  );
}

function renderWithProvider(children: ReactNode) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [] }) }),
  );
  return render(<AtlasProvider>{children}</AtlasProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("YearDisplay", () => {
  it("shows a CE year", () => {
    renderWithProvider(
      <>
        <SetYear year={2026} label="ce" />
        <YearDisplay />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "ce" }));
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("CE")).toBeInTheDocument();
  });

  it("shows a BCE year as its magnitude", () => {
    renderWithProvider(
      <>
        <SetYear year={-2560} label="bce" />
        <YearDisplay />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "bce" }));
    expect(screen.getByText("2560")).toBeInTheDocument();
    expect(screen.getByText("BCE")).toBeInTheDocument();
  });
});
