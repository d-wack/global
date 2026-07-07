import { describe, expect, it } from "vitest";

import { applyLayerFilter, resolveMarkerStyle } from "@/lib/layers";
import type { AtlasEvent } from "@/types/event";
import type { Layer } from "@/types/layer";

function evt(layerIds: string[], id = layerIds.join("+")): AtlasEvent {
  return {
    id,
    title: id,
    description: "",
    layerIds,
    lng: 0,
    lat: 0,
    votes: 0,
    year: 2026,
    createdAt: "2026-07-06T00:00:00.000Z",
  };
}

const layers: Layer[] = [
  {
    id: "news",
    name: "News",
    color: "#111",
    shape: "circle",
    builtin: true,
    defaultVisible: true,
  },
  {
    id: "historical",
    name: "Historical",
    color: "#222",
    shape: "square",
    builtin: true,
    defaultVisible: true,
  },
];
const byId = new Map(layers.map((l) => [l.id, l]));

describe("applyLayerFilter", () => {
  it("keeps events belonging to any active layer", () => {
    const events = [evt(["news"]), evt(["historical"]), evt(["event"])];
    expect(
      applyLayerFilter(events, new Set(["news", "event"])).map((e) => e.id),
    ).toEqual(["news", "event"]);
  });

  it("matches a multi-layer event on any membership", () => {
    const events = [evt(["news", "historical"], "multi")];
    expect(applyLayerFilter(events, new Set(["historical"]))).toHaveLength(1);
  });

  it("shows nothing for an empty active set", () => {
    expect(applyLayerFilter([evt(["news"])], new Set())).toHaveLength(0);
  });
});

describe("resolveMarkerStyle", () => {
  it("uses the first visible layer", () => {
    expect(
      resolveMarkerStyle(
        evt(["news", "historical"]),
        new Set(["historical"]),
        byId,
      ),
    ).toEqual({
      color: "#222",
      shape: "square",
    });
  });

  it("picks the first active layer in order when several are active", () => {
    expect(
      resolveMarkerStyle(
        evt(["news", "historical"]),
        new Set(["news", "historical"]),
        byId,
      ),
    ).toEqual({ color: "#111", shape: "circle" });
  });

  it("falls back to the first known layer when none are active", () => {
    expect(resolveMarkerStyle(evt(["historical"]), new Set(), byId)).toEqual({
      color: "#222",
      shape: "square",
    });
  });

  it("defaults to a circle for an unknown layer id", () => {
    expect(
      resolveMarkerStyle(evt(["mystery"]), new Set(["mystery"]), byId),
    ).toEqual({
      color: "#38bdf8",
      shape: "circle",
    });
  });
});
