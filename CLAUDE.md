# CLAUDE.md

Guidance for automated agents (and humans) working in this repository.

## What this project is

**Planet Atlas** (repo `global`) — a Next.js 16 app: an explorable 3D globe of
the world's news, events, and history, where zoom maps to admin scale and a left
panel ranks "what matters here now." See `Overview.md` for the product vision and
`Bootstrap.md` for the Phase 0 (infra) charter.

Phase 1's first vertical slice is built: a MapLibre globe, a file-backed events
store, click-to-add, voting, a viewport-ranked panel, and typed geocode search —
all behind seams so later phases (PostGIS, GDELT) are swaps, not rewrites.

`AGENTS.md` mirrors this file for other tools — if you change stack,
conventions, commit/branch rules, or the check gate here, update it there too.

## Application architecture (Phase 1)

Everything phase-specific sits behind a boundary; keep it that way.

- **Events repository** (`src/server/repositories/`) — `EventsRepository`
  interface + file-backed impl (JSON at `ATLAS_DATA_DIR`, bootstrapped from
  `src/data/seed-events.json`). Swap to PostGIS via `getEventsRepository()`.
- **Importance** (`src/lib/importance.ts`) — pure `importance(event, now)`;
  votes + recency decay now, feed/spatial terms later. Inject `now`, no I/O.
- **Viewport filter** (`src/lib/viewport.ts`) — pure, client-side bounds/category/
  text filters; becomes a server spatial query in Phase 2.
- **Basemap** (`src/config/map.ts`) — one style constant (CARTO dark → PMTiles/keyed).
- **Geocoder** (`src/server/geocode/`) — `Geocoder` interface + Nominatim impl,
  reached only through `/api/geocode` (never the client directly).
- **Client state** — one React context (`src/state/atlas-context.tsx`) +
  `useMemo`; no external state lib. The map lives in a ref, loaded via
  `next/dynamic` `ssr:false`; markers are managed imperatively.
- All API input is zod-validated (`src/lib/schemas.ts`); fs/geocoder code is
  server-only.

## Stack (do not swap without being asked)

- Node.js **24** (`.nvmrc`, `engines`), pnpm via **corepack** (`packageManager`).
- **Next.js 16**, App Router, TypeScript (strict, `noUncheckedIndexedAccess`),
  `src/` dir, `@/*` alias, Turbopack, `output: 'standalone'`.
- Tailwind CSS 4. ESLint 9 flat config (`eslint.config.mjs`) + Prettier.
- Vitest 4 + React Testing Library + jsdom. Playwright for one e2e smoke test.

## Conventions

- **Package manager is pnpm.** Never introduce `npm`/`yarn` lockfiles. Use
  `pnpm add`/`pnpm add -D`. Commit `pnpm-lock.yaml`.
- **Path alias:** import from `@/…` (maps to `src/…`).
- **Class names:** use `cn()` from `@/lib/utils` to merge Tailwind classes.
- **Formatting/linting are enforced.** Run `pnpm format` and `pnpm lint:fix`;
  don't hand-fight Prettier. `eslint-config-prettier` is applied last.
- **Native build scripts** (sharp, unrs-resolver) are pre-approved in
  `pnpm-workspace.yaml`. If pnpm reports newly ignored builds, approve them
  there rather than disabling the check.

## Commits & branches

- **Conventional Commits**, enforced by commitlint (`commit-msg` hook). Types:
  `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `build`, `refactor`, etc.
- Branch from **`develop`**: `feature/*`, `fix/*`, `chore/*`. Open PRs into
  `develop`. `main` and `develop` are protected and require the `ci-success`
  check. Never push directly to them.
- The `pre-commit` hook runs lint-staged. Keep hooks fast — slow checks
  (typecheck, tests) live in CI only.

## Before you finish a change

Run the same gate CI runs:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Add/adjust tests alongside code: unit/component tests live next to source as
`*.test.ts(x)`; e2e specs live in `e2e/`. Run a single test with
`pnpm test <path-or-name-pattern>` (e.g. `pnpm test utils`) or watch with
`pnpm test:watch`; one e2e spec with `pnpm test:e2e atlas.spec.ts`.

## CI/CD (see README for detail)

- `.github/workflows/ci.yml` — parallel lint/typecheck/test/build/e2e →
  aggregate `ci-success` (the required status check).
- `.github/workflows/deploy.yml` — builds & pushes an image to GHCR always;
  the SSH deploy job is **gated** behind repo variable `DEPLOY_ENABLED=true`
  and a GitHub Environment. Leave it gated unless asked to wire up a server.

## Gotchas

- The e2e test serves the **standalone** build on an uncommon port (3210) to
  avoid colliding with stray dev servers on :3000. Keep it self-contained.
- `next start` warns under `output: 'standalone'` — production runs
  `node .next/standalone/server.js` (the Dockerfile and e2e do this).
- **Events store is ephemeral.** The file store writes to `ATLAS_DATA_DIR`
  (default `<cwd>/.data`, gitignored). Under standalone/Docker that dir is a
  throwaway container path — data is lost on restart. Mount a volume + set
  `ATLAS_DATA_DIR`, or move to PostGIS, for durability. Single-process only.
- `next.config.ts` pins `outputFileTracingRoot`/`turbopack.root` to the project
  so a stray parent-dir lockfile can't misplace the standalone output.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
