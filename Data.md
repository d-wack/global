# Data.md — Planet Atlas data architecture

A living record of how Planet Atlas stores, ingests, and serves data as it scales
from a file-backed prototype toward a real spatial + temporal + full-text platform.
Update this as decisions are made.

## Where we are today

- **Store:** **Neon serverless Postgres + PostGIS**, accessed via **Drizzle**
  (`drizzle-orm/neon-http`), behind the **`EventsRepository`** seam
  (`src/server/repositories/`). The factory (`src/server/repositories/index.ts`)
  selects `DrizzleEventsRepository` when `DATABASE_URL` is set (all Vercel envs +
  a local Neon dev branch) and otherwise falls back to `FileEventsRepository`
  (JSON, seeded from `src/data/seed-events.json`) for offline, UI-only work.
  Schema + migrations live in `src/server/db/schema.ts` and `drizzle/`; the app
  runs on **Vercel** (Fluid Compute, Node runtime). This is the durable serving
  path — the file store is a fallback, not the primary store.
- **Filtering is still client-side** today: viewport (`filterVisible`), time
  (`filterAsOf`), layers (`applyLayerFilter`), and text (`searchFilter`) run in the
  browser over the full event list. Pushing these into PostGIS (bbox, time-range,
  and layer SQL) is the next step behind the same seam — the store moved to
  Postgres before the queries did.

## Domain schema

**Event** (`src/types/event.ts`)

- `id, title, description`
- `layerIds: string[]` — many-to-many layer membership (replaced the old single
  `category`). An event shows if **any** of its layers is enabled.
- `lng, lat` — point location.
- `votes` — net community score.
- `year: number` — occurred year (negative = BCE); powers the timeline.
- `createdAt` — record timestamp (drives importance recency).
- _Planned (Phase C):_ `date` + `precision` (day/week/month/year/century) so the
  timeline can zoom to the day. Additive to `year` for a safe migration window.

**Layer** (`src/types/layer.ts`, built-ins in `src/config/layers.ts`)

- `id, name, color, shape (circle|square|diamond), builtin, defaultVisible`.
- Built-ins (News/Events/Historical) live in code so marker styling works against an
  empty store. User-created, persisted layers come later (see roadmap).

## Postgres schema (current)

The physical `events` table (`src/server/db/schema.ts`; first migration in
`drizzle/` enables PostGIS):

| Column        | Type                    | Notes                                     |
| ------------- | ----------------------- | ----------------------------------------- |
| `id`          | `uuid` (pk)             | primary key                               |
| `title`       | `text`                  |                                           |
| `description` | `text`                  |                                           |
| `layer_ids`   | `text[]`                | GIN index (many-to-many layer membership) |
| `geom`        | `geography(Point,4326)` | GiST index (spatial queries)              |
| `year`        | `integer`               | btree index (negative = BCE)              |
| `votes`       | `integer`               | net community score                       |
| `created_at`  | `timestamptz`           | btree index (desc); importance recency    |

`geom` replaces the domain model's `lng`/`lat` pair at the storage layer; the
`AtlasEvent` type the client sees is unchanged (the repository maps between them).

**`user_views`** (append-only view-log; migration `0002`) — `id`, `user_id text`, `lng`/`lat`/
`zoom` (`double precision`), `year integer`, `created_at timestamptz`; indexes on
`(user_id, created_at desc)` + `created_at`. Captures the **User Context** (`x,y,z,date`) of
settled views for a "places I've visited" history + analytics. **Deliberately orthogonal to
`events`** (no FK, no PostGIS) so it locks in nothing; behind its own `ViewsRepository` seam.
See `Concepts.md`.

### Local dev database

Local dev uses a **Neon dev branch**. Pull its `DATABASE_URL`
(`vercel env pull .env.local`), then run `pnpm db:migrate && pnpm db:seed`.
**Gotcha:** `drizzle-kit`/`tsx` do not auto-load `.env.local` (only Next does),
so export `DATABASE_URL` before the `db:*` scripts. A local Docker Postgres+PostGIS
is the offline alternative; dropping `DATABASE_URL` falls back to the file store.
DB scripts: `db:generate`, `db:migrate`, `db:seed`, `db:studio`.

## Target architecture

The prototype's client-side filtering doesn't survive scale (GDELT alone is millions
of geo-coded events refreshed every ~15 min). The plan separates **storage**,
**serving**, and **search**, each behind the existing seams.

### Serving — Neon Postgres + PostGIS (interactive map queries) — in place

The primary interactive store, **already live** (Neon + PostGIS via Drizzle on
Vercel; see "Where we are today"). It can handle the three things the map does
constantly, server-side: **spatial** (bbox / radius, via the `geom` GiST index),
**temporal** (as-of / range, via `year`/`created_at`), and **layer membership**
(via the `layer_ids` GIN index). Remaining work is moving `filterVisible`/
`filterAsOf`/`applyLayerFilter` off the client and into SQL behind
`EventsRepository` — the store is done, the query pushdown is next.

### Search — Meilisearch (instant text + facets)

Instant, typo-tolerant full-text search with **geosearch** and **faceted filtering**
out of the box, sub-50ms, single binary, low ops. First choice for the search box and
layer/time facets; replaces client-side `searchFilter`. Mid-scale (millions of docs) —
ample for the foreseeable term.

### Lake / archive / ingest — Apache Iceberg

Open table format on object storage (S3/R2). Iceberg **1.9+ adds native
geometry/geography types and nanosecond timestamps**, so it can hold the raw,
space/time-partitioned **archive** of feed data (GDELT, Wikidata) with schema
evolution and time-travel. Role = **lake + ingest/dedup/clean backbone**, queried by
Spark/Trino/DuckDB/PostGIS/Sedona — **not** the low-latency serving path.

### Escalation — OpenSearch (only if needed)

Scales to petabytes with richer geo (`geo_shape`) and aggregations, but heavier ops.
Adopt only if search/geo-analytics scale outgrows Meilisearch.

### Flow

```
sources (GDELT ~15min, Wikidata, user-generated)
   → Iceberg (raw archive, dedup + quality clean, space/time partitioned)
   → PostGIS (serve spatial + temporal + layer)   +   Meilisearch (serve text + facets)
   → API routes (Next.js)
   → client (globe + panel + timeline)
```

## Layer storage evolution

1. **Now:** built-in layers as a code constant (`src/config/layers.ts`).
2. **Phase B:** a `LayersRepository` + `layers.json` (mirroring the events seam) + an
   API + create/edit UI (activates the disabled "+" in the layer chooser).
3. **At scale:** PostGIS `layers` table + an `event_layers` join table.

## Phased migration

1. File repo → **Neon Postgres + PostGIS** (drop-in behind `EventsRepository`).
   _Done — the store is Postgres._ Remaining: move `filterVisible`/`filterAsOf`/
   `applyLayerFilter` server-side as bbox + time-range + layer SQL.
2. Add **Meilisearch**; move `searchFilter` + facets server-side.
3. Stand up the **Iceberg** lake + the GDELT/Wikidata ingestion pipeline; materialize
   cleaned events into PostGIS + Meilisearch.
4. Escalate search to **OpenSearch** only if scale demands.

## Open questions

- **Custom-layer ownership / permissions** once users create layers (auth, sharing).
- **Multi-layer marker precedence** — currently "first visible layer wins"; may want a
  user-set primary layer or per-layer z-order.
- **Time precision vs partitioning** — how `precision` (day…century) maps to Iceberg
  time partitions and PostGIS indexes without fragmenting ancient/sparse data.
- **Dedup keys** for GDELT/Wikidata (circular reporting, near-duplicate events) — the
  quality layer is as important as ranking.
- **BCE / deep-time storage** — `year` handles it now; a full `date` type must remain
  BCE-capable (Postgres `date` doesn't do BCE cleanly → likely keep `year` + optional
  modern `date`).

## Sources

- Iceberg 1.9 native geospatial + ns timestamps — <https://medium.com/data-engineering-with-dremio/introducing-apache-iceberg-1-9-0-native-geospatial-support-enhanced-row-lineage-and-more-dead8950d391>
- Iceberg + Parquet GEO types (Wherobots) — <https://wherobots.com/blog/apache-iceberg-and-parquet-now-support-geo/>
- Spatial tables in lakehouses with Iceberg (Apache Sedona) — <https://sedona.apache.org/latest/blog/2025/10/21/managing-spatial-tables-in-data-lakehouses-with-iceberg/>
- What is Apache Iceberg (Google Cloud) — <https://cloud.google.com/discover/what-is-apache-iceberg>
- Meilisearch vs OpenSearch (Meilisearch docs) — <https://www.meilisearch.com/docs/resources/comparisons/opensearch>
- Meilisearch vs OpenSearch (2026 comparison) — <https://openalternative.co/compare/meilisearch/vs/opensearch>
