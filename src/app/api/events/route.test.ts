import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AtlasEvent, NewEventInput, VoteDirection } from "@/types/event";

// In-memory fake repository, shared with the mocked factory below.
const state = vi.hoisted(() => ({ events: [] as AtlasEvent[], nextId: 1 }));

vi.mock("@/server/repositories", () => ({
  getEventsRepository: () => ({
    async list() {
      return [...state.events];
    },
    async add(input: NewEventInput) {
      const event: AtlasEvent = {
        id: `id-${state.nextId++}`,
        votes: 0,
        createdAt: new Date().toISOString(),
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
  category: "news",
  lng: 10,
  lat: 20,
};

describe("GET /api/events", () => {
  it("returns the current events", async () => {
    await POST(post(validBody));
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.events).toHaveLength(1);
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
