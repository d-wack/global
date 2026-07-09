import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionUser } from "@/server/auth/session";
import type { NewViewInput, UserView } from "@/types/view";

// In-memory fake views store, shared with the mocked factory below. Each row
// remembers the userId it was appended with so listRecent can key on it — this
// is what lets the tests assert user_id comes from the session, not the body.
interface StoredView extends UserView {
  userId: string;
}

/** Project the public shape, dropping the internal userId key. */
function toUserView(row: StoredView): UserView {
  return {
    id: row.id,
    lng: row.lng,
    lat: row.lat,
    zoom: row.zoom,
    year: row.year,
    createdAt: row.createdAt,
  };
}
const state = vi.hoisted(() => ({
  views: [] as StoredView[],
  nextId: 1,
  lastLimit: undefined as number | undefined,
}));

// Controllable session resolution. Defaults to open mode (anonymous user);
// individual tests flip it to the "unauthorized" sentinel or a real userId.
const session = vi.hoisted(() => ({
  user: { userId: undefined } as SessionUser,
}));

vi.mock("@/server/auth/session", () => ({
  getSessionUser: async () => session.user,
}));

vi.mock("@/server/repositories/views-index", () => ({
  getViewsRepository: () => ({
    // Mirrors the real repo: user_id comes only from the argument (the session
    // sub), never from `input`.
    async append(input: NewViewInput, userId: string) {
      const stored: StoredView = {
        id: `id-${state.nextId++}`,
        userId,
        createdAt: new Date().toISOString(),
        ...input,
      };
      state.views.push(stored);
      return toUserView(stored);
    },
    async listRecent(userId: string, limit = 50) {
      state.lastLimit = limit;
      return state.views
        .filter((v) => v.userId === userId)
        .slice(-limit)
        .reverse()
        .map(toUserView);
    },
  }),
}));

import { GET, POST } from "@/app/api/views/route";

beforeEach(() => {
  state.views = [];
  state.nextId = 1;
  state.lastLimit = undefined;
  session.user = { userId: undefined };
});

function post(body: unknown, url = "http://test/api/views"): Request {
  return new Request(url, { method: "POST", body: JSON.stringify(body) });
}

function get(url = "http://test/api/views"): Request {
  return new Request(url, { method: "GET" });
}

const validBody = { lng: 10, lat: 20, zoom: 3, year: 2026 };

describe("POST /api/views", () => {
  it("returns 401 when the session is unauthorized (auth on, no login)", async () => {
    session.user = "unauthorized";
    const res = await POST(post(validBody));
    expect(res.status).toBe(401);
    expect(state.views).toHaveLength(0);
  });

  it("no-ops with 204 in open mode without writing a row", async () => {
    // Default session is open mode (userId undefined).
    const res = await POST(post(validBody));
    expect(res.status).toBe(204);
    expect(state.views).toHaveLength(0);
  });

  it("appends a view and returns 201 for an authenticated user", async () => {
    session.user = { userId: "auth0|real-user" };
    const res = await POST(post(validBody));
    expect(res.status).toBe(201);
    const { view } = await res.json();
    expect(view.id).toBeTruthy();
    expect(view.lng).toBe(10);
    expect(view.year).toBe(2026);
    expect(state.views).toHaveLength(1);
  });

  it("keys the row on the session sub, not a spoofed body userId", async () => {
    session.user = { userId: "auth0|real-user" };
    const res = await POST(
      post({ ...validBody, userId: "auth0|attacker", user_id: "x" }),
    );
    expect(res.status).toBe(201);
    // The stored row is owned by the session user…
    expect(state.views[0]?.userId).toBe("auth0|real-user");
    // …and is invisible to the attacker's id.
    session.user = { userId: "auth0|attacker" };
    const listed = await (await GET(get())).json();
    expect(listed.views).toHaveLength(0);
  });

  it("rejects out-of-range input with 400", async () => {
    session.user = { userId: "auth0|real-user" };
    const res = await POST(post({ ...validBody, zoom: 99 }));
    expect(res.status).toBe(400);
    expect(state.views).toHaveLength(0);
  });

  it("rejects a malformed body with 400", async () => {
    session.user = { userId: "auth0|real-user" };
    const res = await POST(
      new Request("http://test/api/views", { method: "POST", body: "nope" }),
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/views", () => {
  it("returns 401 when the session is unauthorized", async () => {
    session.user = "unauthorized";
    const res = await GET(get());
    expect(res.status).toBe(401);
  });

  it("returns an empty list in open mode", async () => {
    const res = await GET(get());
    expect(res.status).toBe(200);
    expect((await res.json()).views).toEqual([]);
  });

  it("lists the caller's own views, newest first", async () => {
    session.user = { userId: "auth0|real-user" };
    await POST(post({ ...validBody, year: 2000 }));
    await POST(post({ ...validBody, year: 2020 }));
    const res = await GET(get());
    expect(res.status).toBe(200);
    const { views } = await res.json();
    expect(views).toHaveLength(2);
    expect(views[0].year).toBe(2020);
  });

  it("clamps ?limit= to a sane maximum", async () => {
    session.user = { userId: "auth0|real-user" };
    await GET(get("http://test/api/views?limit=9999"));
    expect(state.lastLimit).toBe(200);
  });

  it("forwards a valid ?limit= to the repository", async () => {
    session.user = { userId: "auth0|real-user" };
    await GET(get("http://test/api/views?limit=5"));
    expect(state.lastLimit).toBe(5);
  });

  it("ignores a non-numeric ?limit= (falls back to the repo default)", async () => {
    session.user = { userId: "auth0|real-user" };
    await GET(get("http://test/api/views?limit=abc"));
    // undefined → the mock's default parameter of 50.
    expect(state.lastLimit).toBe(50);
  });
});
