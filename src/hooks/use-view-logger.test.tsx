import { act, renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import type { ReactNode } from "react";

import { useViewLogger, VIEW_LOG_DEBOUNCE_MS } from "@/hooks/use-view-logger";
import { AtlasProvider, useAtlas } from "@/state/atlas-context";

function wrapper({ children }: { children: ReactNode }) {
  return <AtlasProvider>{children}</AtlasProvider>;
}

/** POST bodies sent to /api/views, in order. */
function postedViews(fetchMock: Mock): string[] {
  return fetchMock.mock.calls
    .filter(([url, init]) => url === "/api/views" && init?.method === "POST")
    .map(([, init]) => init.body as string);
}

let fetchMock: Mock;

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ events: [] }) });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function renderLogger() {
  return renderHook(
    () => {
      const atlas = useAtlas();
      useViewLogger();
      return atlas;
    },
    { wrapper },
  );
}

describe("useViewLogger", () => {
  it("does not post before the debounce elapses", () => {
    const { result } = renderLogger();
    act(() => result.current.setView({ lng: 10, lat: 20, zoom: 5 }));
    act(() =>
      result.current.setBounds({ west: 0, south: 0, east: 20, north: 40 }),
    );

    act(() => vi.advanceTimersByTime(VIEW_LOG_DEBOUNCE_MS - 1));
    expect(postedViews(fetchMock)).toHaveLength(0);
  });

  it("posts one settled view after the viewport stills", () => {
    const { result } = renderLogger();
    act(() => result.current.setView({ lng: 10, lat: 20, zoom: 5 }));
    act(() =>
      result.current.setBounds({ west: 0, south: 0, east: 20, north: 40 }),
    );
    act(() => vi.advanceTimersByTime(VIEW_LOG_DEBOUNCE_MS));

    const posts = postedViews(fetchMock);
    expect(posts).toHaveLength(1);
    expect(JSON.parse(posts[0]!)).toEqual({
      lng: 10,
      lat: 20,
      zoom: 5,
      year: new Date().getFullYear(),
    });
  });

  it("skips an identical consecutive view", () => {
    const { result } = renderLogger();
    act(() => result.current.setView({ lng: 10, lat: 20, zoom: 5 }));
    act(() =>
      result.current.setBounds({ west: 0, south: 0, east: 20, north: 40 }),
    );
    act(() => vi.advanceTimersByTime(VIEW_LOG_DEBOUNCE_MS));
    expect(postedViews(fetchMock)).toHaveLength(1);

    // A fresh bounds object with the same center/zoom/year must not re-post.
    act(() =>
      result.current.setBounds({ west: 0, south: 0, east: 20, north: 41 }),
    );
    act(() => vi.advanceTimersByTime(VIEW_LOG_DEBOUNCE_MS));
    expect(postedViews(fetchMock)).toHaveLength(1);
  });

  it("posts again when the year changes", () => {
    const { result } = renderLogger();
    act(() => result.current.setView({ lng: 10, lat: 20, zoom: 5 }));
    act(() =>
      result.current.setBounds({ west: 0, south: 0, east: 20, north: 40 }),
    );
    act(() => vi.advanceTimersByTime(VIEW_LOG_DEBOUNCE_MS));

    act(() => result.current.setSelectedYear(1865));
    act(() => vi.advanceTimersByTime(VIEW_LOG_DEBOUNCE_MS));

    const posts = postedViews(fetchMock);
    expect(posts).toHaveLength(2);
    expect(JSON.parse(posts[1]!).year).toBe(1865);
  });
});
