import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FileViewsRepository } from "@/server/repositories/file-views-repository";
import type { NewViewInput } from "@/types/view";

let dir: string;
let file: string;

const sample: NewViewInput = {
  lng: 12.5,
  lat: 41.9,
  zoom: 5.25,
  year: 2026,
};

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "atlas-views-"));
  file = path.join(dir, "views.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("FileViewsRepository", () => {
  it("starts empty (no seed) and returns nothing for an unseen user", async () => {
    const repo = new FileViewsRepository(file);
    expect(await repo.listRecent("u1")).toEqual([]);
  });

  it("appends a view with a generated id and timestamp, omitting userId", async () => {
    const repo = new FileViewsRepository(file);
    const created = await repo.append(sample, "u1");

    expect(created.id).toBeTruthy();
    expect(created).not.toHaveProperty("userId");
    expect(created.lng).toBe(12.5);
    expect(created.zoom).toBe(5.25);
    expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
  });

  it("lists a user's views newest-first", async () => {
    const repo = new FileViewsRepository(file);
    const first = await repo.append({ ...sample, year: 2000 }, "u1");
    // Ensure a strictly later createdAt so ordering is deterministic.
    await new Promise((r) => setTimeout(r, 5));
    const second = await repo.append({ ...sample, year: 2026 }, "u1");

    const recent = await repo.listRecent("u1");
    expect(recent.map((v) => v.id)).toEqual([second.id, first.id]);
  });

  it("scopes listRecent to the requesting user", async () => {
    const repo = new FileViewsRepository(file);
    await repo.append(sample, "u1");
    await repo.append(sample, "u2");

    const forU1 = await repo.listRecent("u1");
    expect(forU1).toHaveLength(1);
    expect(await repo.listRecent("u2")).toHaveLength(1);
  });

  it("caps results at the given limit", async () => {
    const repo = new FileViewsRepository(file);
    for (let i = 0; i < 5; i++) {
      await repo.append({ ...sample, year: 2000 + i }, "u1");
    }
    expect(await repo.listRecent("u1", 3)).toHaveLength(3);
  });

  it("persists appends across repository instances", async () => {
    const created = await new FileViewsRepository(file).append(sample, "u1");
    const reread = await new FileViewsRepository(file).listRecent("u1");
    expect(reread.some((v) => v.id === created.id)).toBe(true);
  });

  it("is append-only and does not clobber under concurrent appends", async () => {
    const repo = new FileViewsRepository(file);
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        repo.append({ ...sample, year: 2000 + i }, "u1"),
      ),
    );

    expect(await repo.listRecent("u1", 100)).toHaveLength(10);
    const persisted = JSON.parse(await readFile(file, "utf8"));
    expect(persisted).toHaveLength(10);
  });
});
