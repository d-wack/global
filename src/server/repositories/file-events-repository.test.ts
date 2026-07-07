import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FileEventsRepository } from "@/server/repositories/file-events-repository";
import type { NewEventInput } from "@/types/event";

let dir: string;
let file: string;

const sample: NewEventInput = {
  title: "Test event",
  description: "A description",
  layerIds: ["news"],
  lng: 12.5,
  lat: 41.9,
  year: 2026,
};

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "atlas-events-"));
  file = path.join(dir, "events.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("FileEventsRepository", () => {
  it("bootstraps from the seed on first read and writes the file", async () => {
    const repo = new FileEventsRepository(file);
    const events = await repo.list();

    expect(events.length).toBeGreaterThan(0);
    const persisted = JSON.parse(await readFile(file, "utf8"));
    expect(persisted).toHaveLength(events.length);
  });

  it("adds an event with a generated id, zero votes, and a timestamp", async () => {
    const repo = new FileEventsRepository(file);
    const before = (await repo.list()).length;

    const created = await repo.add(sample);

    expect(created.id).toBeTruthy();
    expect(created.votes).toBe(0);
    expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
    expect(await repo.list()).toHaveLength(before + 1);
  });

  it("votes up and down, adjusting the net score", async () => {
    const repo = new FileEventsRepository(file);
    const created = await repo.add(sample);

    expect((await repo.vote(created.id, "up"))?.votes).toBe(1);
    expect((await repo.vote(created.id, "up"))?.votes).toBe(2);
    expect((await repo.vote(created.id, "down"))?.votes).toBe(1);
  });

  it("returns null when voting on an unknown id", async () => {
    const repo = new FileEventsRepository(file);
    expect(await repo.vote("does-not-exist", "up")).toBeNull();
  });

  it("persists data across repository instances", async () => {
    const created = await new FileEventsRepository(file).add(sample);
    const reread = await new FileEventsRepository(file).list();
    expect(reread.some((e) => e.id === created.id)).toBe(true);
  });

  it("does not clobber events under concurrent adds", async () => {
    const repo = new FileEventsRepository(file);
    const base = (await repo.list()).length;

    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        repo.add({ ...sample, title: `Concurrent ${i}` }),
      ),
    );

    expect(await repo.list()).toHaveLength(base + 10);
  });
});
