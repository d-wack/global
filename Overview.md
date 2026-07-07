# Planet Atlas — Application Overview

> Working title. Rename freely — no name is locked.

A living, explorable atlas of the world's news, events, and history. The user scrolls a 3D globe and, at every zoom level, sees what matters most _there_ — the planet's biggest stories when zoomed out, a country's when zoomed in, a city's when closer still. Authoritative data feeds seed it; people can add and vote on entries, growing toward a Wikipedia-like commons over time.

This document is the product and architecture reference. It captures the vision, the domain model, the feature surface, the stack, the deliberate seams, and the phased roadmap. Use it as planning input; it describes intent, not a task list.

---

## 1. What it is

Most news is organized by time (a feed) or by topic (a section). This is organized by **place**. The map _is_ the interface. Instead of asking "what's in the news," the user asks "what's happening _here_" — anywhere on Earth, at any scale — and the answer is spatial and rankable.

Three kinds of things live on the map:

- **News** — current events, geo-located (protests, openings, incidents, announcements).
- **Events** — happenings tied to a place and often a time (festivals, conferences, launches).
- **Historical** — what happened here (landmarks, past events, context).

The long-term shape is a crowd-curated, source-fed, spatially-indexed record of the world — part live news map, part historical atlas, part community wiki.

## 2. The core idea: zoom as hierarchy

The defining mechanic is that **zoom level maps to administrative scale**, and the side panel always answers "what matters at this level right now."

- Whole planet → the world's most significant stories.
- A country (e.g. the US) → that country's most significant stories.
- A region/state (e.g. Georgia) → that region's.
- A city/locality → local news, events, and history.

As the viewport changes, the left panel re-ranks and re-populates. Zooming is browsing. This is the product's signature and also its hardest design problem (see §6).

## 3. Users and core journeys

- **Explore** — spin the globe, drift into a region, read what surfaces.
- **Search a place** — say or type "take me to Tbilisi" and fly there.
- **Drill down** — zoom from country to city, watching the panel refocus.
- **Contribute** — drop an event on the map with a title, category, and description.
- **Curate** — vote entries up or down so the important ones rise.

## 4. Domain model

Core entity today is the **event**:

- `id`, `title`, `description`
- `category` — `news | event | historical`
- `lng`, `lat` — point location
- `votes` — net community score (anonymous for now)
- `createdAt`

Concepts that enter in later phases:

- **Importance score** — a derived ranking value (votes + recency + feed significance + zoom/admin relevance).
- **Admin tags** — country / region / locality assigned per event (via point-in-polygon against boundary data), so "zoom to X" is a filter.
- **Source / provenance** — feed-ingested vs. user-submitted; different trust levels.
- **Moderation status** — for the UGC/wiki phase (draft, published, flagged, soft-deleted).
- **Time / date** — first-class for historical entries and event scheduling.

## 5. Feature areas

- **Globe exploration** — MapLibre 3D globe; pan, zoom, rotate; a dark, observatory-style basemap with a live coordinate/zoom instrument readout.
- **Viewport-ranked panel** — the left panel lists events currently in view, ranked by importance, with category filters and text search, and a live "N events in view" count.
- **Click-to-add** — an add mode where clicking the map places a new event via a small form.
- **Voting** — up/down on each event; seeds the eventual community-curation model.
- **Voice + typed location search** — speak a place name (transcribed via ElevenLabs Scribe v2), geocode it (Nominatim), and fly the map to it, fitting the result's bounding box so scale matches the place. A typed fallback shares the same geocode path (also an accessibility path).
- **Data ingestion** _(later)_ — GDELT for live geo-coded news/events, Wikidata for historical, refreshed on a schedule.
- **Community wiki** _(later)_ — richer editing, voting at scale, trust/reputation, moderation, and spam handling.

## 6. The importance-ranking challenge (core design problem)

The plumbing (map, CI/CD, storage) is solved territory. The genuinely hard, product-defining work is **ranking**: deciding what surfaces at each zoom level.

A workable model blends:

- **Feed significance** — for GDELT, mention/article counts and coverage volume.
- **Community signal** — net votes on user and feed entries.
- **Recency** — a decay so fresh stories outrank stale ones.
- **Spatial relevance** — filter to the viewport / admin level, then rank within it.

Dedup and quality matter as much as ranking: feed data will contain duplicates, circular reporting, and low-quality sources, so a cleaning/merging layer is core, not optional. Expect to iterate on the scoring function indefinitely — it is the secret sauce.

## 7. Data sources and trust

- **GDELT** — free, global, geo-coded event database refreshed every ~15 minutes; the backbone for live news/events. Auto-coded, so it needs dedup and quality filtering.
- **Wikidata** — structured historical events with coordinates and dates, for the "what happened here" layer.
- **User-generated** — community submissions and votes; trends toward a wiki model with the associated moderation needs.

These three carry different trust levels; the importance/quality layer must reconcile them rather than treating them as equivalent.

## 8. Technical architecture

**Application**

- Next.js 16 (App Router, TypeScript), Turbopack default.
- MapLibre GL JS v5 globe projection; dark raster basemap (CARTO/OSM) now, self-hosted vector tiles (PMTiles) or a keyed provider later.
- Tailwind for UI; a dark "situation-room" visual identity with a monospace instrument readout as the signature.

**Data & services**

- Phase 1: a file-backed store behind a repository interface (stand-in for the database).
- Phase 2+: PostGIS for spatial storage and server-side bounding-box / admin queries.
- ElevenLabs Scribe v2 for speech-to-text; Nominatim for geocoding — both server-side, both behind provider interfaces.
- All secrets server-side only; all API input validated with zod.

**Infrastructure & delivery**

- GitHub for source + CI/CD; branch-protected `main` (prod) and `develop` (staging), PR-gated with required checks.
- Docker images built in CI, pushed to GHCR; deployed by SSH to a self-hosted Hostinger VPS via Docker Compose behind a Caddy reverse proxy (auto-TLS). Deploy is gated until the VPS is provisioned.
- Local dev machine as the working environment; optional future move to a self-hosted git server (Forgejo) and a team of committing agents, each with its own identity, working through PRs and required CI.

## 9. Architectural principles & seams

Everything phase-specific is isolated behind a boundary so later phases are **swaps, not rewrites**:

- **Events repository** — file store → PostGIS.
- **Importance function** — pure and isolated; votes+recency now, feed-significance blend later.
- **Viewport filtering** — client-side bounds filter now → server-side spatial query later.
- **Basemap tiles** — one config constant; CARTO → PMTiles/MapTiler later.
- **STT provider** — ElevenLabs → Web Speech API or other, behind an interface.
- **Geocoder** — Nominatim → keyed/self-hosted, behind an interface.
- **Deploy** — build-and-push always; server deploy gated by a flag until infra is ready.

Guiding rules: server-side keys only, typed boundaries (zod), small scoped commits, CI green before merge, and documentation (`README`, `CLAUDE.md`) kept current so agent sessions inherit context.

## 10. Roadmap (directional, not fixed)

- **Phase 0 — Foundation.** Repo, tooling, CI/CD pipeline (green from day one), gated CD, branch protection. _In progress._
- **Phase 1 — Explorable globe.** Interactive globe, click-to-add events, voting, viewport-ranked panel, voice + typed location search, file persistence. _First vertical slice delivered:_ globe, file-backed store, click-to-add, voting, ranked panel, and typed geocode search. Remaining: voice (ElevenLabs Scribe) search.
- **Phase 2 — Real data spine.** PostGIS behind the repository seam, server-side spatial/bbox queries, admin-boundary tagging, first GDELT ingest, real importance blend.
- **Phase 3 — Depth.** Wikidata historical layer, richer ranking and themes/categories, self-hosted vector tiles, keyed geocoding, marker clustering (e.g. H3) for density.
- **Phase 4 — Community.** Wiki-style editing, voting at scale, trust/reputation, moderation and spam handling, accounts.
- **Later / optional.** Self-hosted git + agent team, TTS spoken confirmations, performance and scale work.

## 11. Risks & open questions

- **Data quality** — dedup, circular reporting, and source trust in GDELT will make or break credibility.
- **Ranking design** — the importance function is the core product bet and will need constant iteration.
- **Moderation & liability** — a crowd-sourced record of real events and people carries real content-moderation weight; schema should anticipate it (status, soft-delete) before it's needed.
- **Single-VPS load** — SSR + PostGIS + CI + reverse proxy contending on one box; plan to separate concerns as load grows.
- **Tile & geocoder limits** — free tiers (CARTO, Nominatim) have usage limits; production wants self-hosted or keyed providers.

## 12. Out of scope (for now)

Auth/accounts, moderation tooling, real-time updates, native mobile apps, TTS confirmations, and multi-result search disambiguation are deliberately deferred. Early phases keep votes anonymous and the surface small.

## 13. Using this with plan mode

- **Decided:** the stack (Next.js 16 / TypeScript / MapLibre v5 / PostGIS-later), GitHub CI/CD with dev/prod, the seam-based architecture, and the phase ordering.
- **Open (room to plan):** the name, the specifics of the importance-ranking formula, the moderation/trust model, the exact GDELT ingestion and dedup strategy, the tile/geocoder production choices, and the agent-team workflow details.

Plan against the decided items; propose options for the open ones.
