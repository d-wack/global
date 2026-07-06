import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GeocodeSearch } from "@/components/search/geocode-search";
import { AtlasProvider } from "@/state/atlas-context";

function routedFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/geocode")) {
      return {
        ok: true,
        json: async () => ({
          results: [
            {
              name: "Tbilisi, Georgia",
              lng: 44.8,
              lat: 41.7,
              bbox: [44.7, 41.6, 44.9, 41.8],
            },
          ],
        }),
      } as Response;
    }
    // /api/events (provider mount)
    return { ok: true, json: async () => ({ events: [] }) } as Response;
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GeocodeSearch", () => {
  it("shows debounced results and selecting one fills the input", async () => {
    vi.stubGlobal("fetch", routedFetch());
    render(
      <AtlasProvider>
        <GeocodeSearch />
      </AtlasProvider>,
    );

    fireEvent.change(screen.getByLabelText("Search for a place"), {
      target: { value: "Tbilisi" },
    });

    const result = await screen.findByRole("button", {
      name: /Tbilisi, Georgia/,
    });
    fireEvent.click(result);

    expect(screen.getByLabelText("Search for a place")).toHaveValue(
      "Tbilisi, Georgia",
    );
  });
});
