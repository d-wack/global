import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AtlasEvent, VoteDirection } from "@/types/event";

const state = vi.hoisted(() => ({
  events: [] as AtlasEvent[],
}));

vi.mock("@/server/repositories", () => ({
  getEventsRepository: () => ({
    async list() {
      return [...state.events];
    },
    async add() {
      throw new Error("not used");
    },
    async vote(id: string, direction: VoteDirection) {
      const event = state.events.find((e) => e.id === id);
      if (!event) return null;
      event.votes += direction === "up" ? 1 : -1;
      return event;
    },
  }),
}));

import { POST } from "@/app/api/events/[id]/vote/route";

function makeEvent(id: string, votes = 0): AtlasEvent {
  return {
    id,
    title: "T",
    description: "",
    category: "news",
    lng: 0,
    lat: 0,
    votes,
    year: 2026,
    createdAt: new Date().toISOString(),
  };
}

function voteRequest(direction: string): Request {
  return new Request("http://test/api/events/e1/vote", {
    method: "POST",
    body: JSON.stringify({ direction }),
  });
}

beforeEach(() => {
  state.events = [makeEvent("e1", 5)];
});

describe("POST /api/events/[id]/vote", () => {
  it("increments votes on an up-vote", async () => {
    const res = await POST(voteRequest("up"), {
      params: Promise.resolve({ id: "e1" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).event.votes).toBe(6);
  });

  it("decrements votes on a down-vote", async () => {
    const res = await POST(voteRequest("down"), {
      params: Promise.resolve({ id: "e1" }),
    });
    expect((await res.json()).event.votes).toBe(4);
  });

  it("returns 404 for an unknown event", async () => {
    const res = await POST(voteRequest("up"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid direction", async () => {
    const res = await POST(voteRequest("sideways"), {
      params: Promise.resolve({ id: "e1" }),
    });
    expect(res.status).toBe(400);
  });
});
