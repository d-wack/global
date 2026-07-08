import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { VIEWS_FILE } from "@/config/data";
import type { NewViewInput, UserView } from "@/types/view";

import { DEFAULT_RECENT_LIMIT, type ViewsRepository } from "./views-repository";

/**
 * File-backed {@link ViewsRepository} — the offline stand-in for Postgres.
 *
 * Server-only (imports `node:fs`, so it can never be bundled into a client
 * component). Persists an append-only JSON array at `filePath`, starting empty
 * (unlike events, there is no seed). To keep the read side keyed like the DB, a
 * per-row `userId` is stored alongside the public {@link UserView} fields, and
 * `listRecent` filters on it. `append` never rewrites existing rows.
 *
 * Concurrency: mutating operations are serialized through a per-instance promise
 * chain, and writes are atomic (temp file + rename) — correct within one Node
 * process. Multi-process durability is a non-goal; that's the Postgres swap.
 */

/** Persisted row: the public view plus its owning user id (the query key). */
interface StoredView extends UserView {
  userId: string;
}

/** Project the public {@link UserView} shape, dropping the internal userId key. */
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

export class FileViewsRepository implements ViewsRepository {
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string = VIEWS_FILE) {}

  async append(input: NewViewInput, userId: string): Promise<UserView> {
    return this.mutate((views) => {
      const stored: StoredView = {
        id: randomUUID(),
        userId,
        lng: input.lng,
        lat: input.lat,
        zoom: input.zoom,
        year: input.year,
        createdAt: new Date().toISOString(),
      };
      return { next: [...views, stored], result: toUserView(stored) };
    });
  }

  async listRecent(
    userId: string,
    limit: number = DEFAULT_RECENT_LIMIT,
  ): Promise<UserView[]> {
    const views = await this.read();
    return views
      .filter((v) => v.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map(toUserView);
  }

  private async read(): Promise<StoredView[]> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as StoredView[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        // No seed — the view log starts empty.
        return [];
      }
      throw err;
    }
  }

  private async write(views: StoredView[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(tmp, `${JSON.stringify(views, null, 2)}\n`, "utf8");
    await rename(tmp, this.filePath);
  }

  /**
   * Serialize a read-modify-write against the file so concurrent appends can't
   * clobber one another. The mutator is pure: it receives the current rows and
   * returns the next array plus a result value.
   */
  private mutate<T>(
    mutator: (views: StoredView[]) => { next: StoredView[]; result: T },
  ): Promise<T> {
    const run = this.writeQueue.then(async () => {
      const views = await this.read();
      const { next, result } = mutator(views);
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
