import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionUser } from "@/server/auth/session";
import type { AtlasEvent, NewEventInput, VoteDirection } from "@/types/event";

// In-memory fake repository, shared with the mocked factory below.
const state = vi.hoisted(() => ({ events: [] as AtlasEvent[], nextId: 1 }));

// Controllable session resolution. Defaults to open mode (anonymous user);
// individual tests flip it to the "unauthorized" sentinel or a real userId.
const session = vi.hoisted(() => ({
  user: { userId: undefined } as SessionUser,
}));

vi.mock("@/server/auth/session", () => ({
  getSessionUser: async () => session.user,
}));

vi.mock("@/server/repositories", () => ({
  getEventsRepository: () => ({
    async list() {
      return [...state.events];
    },
    // Mirrors the real repo: attribution comes only from the session `userId`,
    // never from the request body.
    async add(input: NewEventInput, userId?: string) {
      const event: AtlasEvent = {
        id: `id-${state.nextId++}`,
        votes: 0,
        createdAt: new Date().toISOString(),
        createdBy: userId ?? null,
        ...input,
      };
      state.events.push(event);
      return event;
    },
    async vote(id: string, direction: VoteDirection) {
      const event = state.events.find((e) => e.id === id);
      if (!event) return null;
      event.votes += direction === "up" ? 1 : -1;
      return event;
    },
  }),
}));

import { GET, POST } from "@/app/api/events/route";

beforeEach(() => {
  state.events = [];
  state.nextId = 1;
  session.user = { userId: undefined };
});

function post(body: unknown): Request {
  return new Request("http://test/api/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = {
  title: "New event",
  description: "Description",
  layerIds: ["news"],
  lng: 10,
  lat: 20,
  year: 2026,
};

describe("GET /api/events", () => {
  it("returns the current events", async () => {
    await POST(post(validBody));
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.events).toHaveLength(1);
  });

  it("never 401s — even a rejected session lists events anonymously", async () => {
    session.user = "unauthorized";
    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe("POST /api/events", () => {
  it("creates an event and returns 201", async () => {
    const res = await POST(post(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.event.id).toBeTruthy();
    expect(json.event.votes).toBe(0);
    expect(json.event.title).toBe("New event");
  });

  it("returns 401 when the session is unauthorized (auth on, no login)", async () => {
    session.user = "unauthorized";
    const res = await POST(post(validBody));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
    // No event should have been created.
    expect(await (await GET()).json().then((j) => j.events)).toHaveLength(0);
  });

  it("attributes createdBy to the session user, not the request body", async () => {
    // A malicious body tries to spoof attribution to another user.
    session.user = { userId: "auth0|real-user" };
    const res = await POST(
      post({ ...validBody, createdBy: "auth0|attacker", created_by: "x" }),
    );
    expect(res.status).toBe(201);
    const { event } = await res.json();
    expect(event.createdBy).toBe("auth0|real-user");
  });

  it("records null attribution for an anonymous (open-mode) creator", async () => {
    const res = await POST(post(validBody));
    expect((await res.json()).event.createdBy).toBeNull();
  });

  it("rejects invalid input with 400", async () => {
    const res = await POST(post({ ...validBody, lat: 200 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBeTruthy();
  });

  it("rejects a malformed body with 400", async () => {
    const res = await POST(
      new Request("http://test/api/events", {
        method: "POST",
        body: "not json",
      }),
    );
    expect(res.status).toBe(400);
  });
});
