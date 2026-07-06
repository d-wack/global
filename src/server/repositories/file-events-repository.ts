import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { EVENTS_FILE } from "@/config/data";
import seedData from "@/data/seed-events.json";
import type { AtlasEvent, NewEventInput, VoteDirection } from "@/types/event";

import type { EventsRepository } from "./events-repository";

/**
 * File-backed {@link EventsRepository} — the Phase 1 stand-in for a database.
 *
 * Server-only: it imports `node:fs`, so it can never be bundled into a client
 * component (Next fails the build if it tries). Reads/writes a JSON array at
 * `filePath`, bootstrapping from the committed seed on first access.
 *
 * Concurrency: mutating operations are serialized through a per-instance promise
 * chain, and writes are atomic (temp file + rename). This is correct within a
 * single Node process (our standalone container runs one). Multi-process
 * durability is a non-goal here and is what the PostGIS swap provides.
 */

const SEED_EVENTS = seedData as AtlasEvent[];

export class FileEventsRepository implements EventsRepository {
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string = EVENTS_FILE) {}

  async list(): Promise<AtlasEvent[]> {
    return this.read();
  }

  async add(input: NewEventInput): Promise<AtlasEvent> {
    return this.mutate((events) => {
      const event: AtlasEvent = {
        id: randomUUID(),
        title: input.title,
        description: input.description,
        category: input.category,
        lng: input.lng,
        lat: input.lat,
        votes: 0,
        createdAt: new Date().toISOString(),
      };
      return { next: [...events, event], result: event };
    });
  }

  async vote(id: string, direction: VoteDirection): Promise<AtlasEvent | null> {
    return this.mutate((events) => {
      const index = events.findIndex((e) => e.id === id);
      const current = events[index];
      if (!current) return { next: events, result: null };
      const updated: AtlasEvent = {
        ...current,
        votes: current.votes + (direction === "up" ? 1 : -1),
      };
      const next = [...events];
      next[index] = updated;
      return { next, result: updated };
    });
  }

  private async read(): Promise<AtlasEvent[]> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as AtlasEvent[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        // First access: seed the writable store from the committed seed file.
        const seeded = [...SEED_EVENTS];
        await this.write(seeded);
        return seeded;
      }
      throw err;
    }
  }

  private async write(events: AtlasEvent[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(tmp, `${JSON.stringify(events, null, 2)}\n`, "utf8");
    await rename(tmp, this.filePath);
  }

  /**
   * Serialize a read-modify-write against the file so concurrent requests can't
   * clobber one another. The mutator is pure: it receives the current events and
   * returns the next array plus a result value.
   */
  private mutate<T>(
    mutator: (events: AtlasEvent[]) => { next: AtlasEvent[]; result: T },
  ): Promise<T> {
    const run = this.writeQueue.then(async () => {
      const events = await this.read();
      const { next, result } = mutator(events);
      await this.write(next);
      return result;
    });
    // Keep the queue alive regardless of whether this operation resolves.
    this.writeQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
}
