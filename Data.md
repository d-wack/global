# Data.md — Planet Atlas data architecture

A living record of how Planet Atlas stores, ingests, and serves data as it scales
from a file-backed prototype toward a real spatial + temporal + full-text platform.
Update this as decisions are made.

## Where we are today

- **Store:** a JSON file (`src/data/seed-events.json` seeds it; runtime writes to
  `ATLAS_DATA_DIR`, default `<cwd>/.data`) behind the **`EventsRepository`** seam
  (`src/server/repositories/`). Single-process, no concurrency beyond an in-process
  mutex. Fine for the prototype; not durable under standalone/Docker.
- **All filtering is client-side** today: viewport (`filterVisible`), time
  (`filterAsOf`), layers (`applyLayerFilter`), and text (`searchFilter`) run in the
  browser over the full event list. This is the seam that a database/search backend
  replaces.

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

## Target architecture

The prototype's client-side filtering doesn't survive scale (GDELT alone is millions
of geo-coded events refreshed every ~15 min). The plan separates **storage**,
**serving**, and **search**, each behind the existing seams.

### Serving — PostGIS (interactive map queries)

The primary interactive store. Handles the three things the map does constantly:
**spatial** (bbox / radius), **temporal** (as-of / range), and **layer membership**
filtering, server-side. Drops in behind `EventsRepository`, replacing client-side
`filterVisible`/`filterAsOf`. This is the already-planned Phase 2 "data spine."

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

1. File repo → **PostGIS** (drop-in behind `EventsRepository`; move `filterVisible`/
   `filterAsOf` server-side as bbox + time-range SQL).
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
