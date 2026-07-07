import { describe, expect, it } from "vitest";

import { applyVoteToggle } from "@/hooks/use-events";
import type { AtlasEvent } from "@/types/event";

const base: AtlasEvent = {
  id: "e1",
  title: "Test",
  description: "",
  layerIds: ["news"],
  lng: 0,
  lat: 0,
  votes: 0,
  year: 2026,
  createdAt: "2026-07-05T00:00:00.000Z",
  userVote: null,
};

describe("applyVoteToggle", () => {
  it("adds a fresh up vote", () => {
    const next = applyVoteToggle(base, "up");
    expect(next.votes).toBe(1);
    expect(next.userVote).toBe("up");
  });

  it("adds a fresh down vote", () => {
    const next = applyVoteToggle(base, "down");
    expect(next.votes).toBe(-1);
    expect(next.userVote).toBe("down");
  });

  it("toggles off when voting the same direction again", () => {
    const next = applyVoteToggle({ ...base, votes: 1, userVote: "up" }, "up");
    expect(next.votes).toBe(0);
    expect(next.userVote).toBeNull();
  });

  it("switches sides in one step (net 2)", () => {
    const next = applyVoteToggle({ ...base, votes: 1, userVote: "up" }, "down");
    expect(next.votes).toBe(-1);
    expect(next.userVote).toBe("down");
  });

  it("treats an undefined userVote as a fresh vote", () => {
    const noVote: AtlasEvent = { ...base, userVote: undefined };
    const next = applyVoteToggle(noVote, "up");
    expect(next.votes).toBe(1);
    expect(next.userVote).toBe("up");
  });
});
