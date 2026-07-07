# CLAUDE.md

Guidance for automated agents (and humans) working in this repository.

## What this project is

**Planet Atlas** (repo `global`) — a Next.js 16 app: an explorable 3D globe of
the world's news, events, and history, where zoom maps to admin scale and a left
panel ranks "what matters here now." See `Overview.md` for the product vision and
`Bootstrap.md` for the Phase 0 (infra) charter.

Phase 1's first vertical slice is built: a MapLibre globe, a Postgres events
store (Neon + PostGIS via Drizzle), click-to-add, voting, a viewport-ranked
panel, and typed geocode search — all behind seams so later phases (GDELT
ingestion, search) are swaps, not rewrites. It deploys to Vercel.

`AGENTS.md` mirrors this file for other tools — if you change stack,
conventions, commit/branch rules, or the check gate here, update it there too.

## Application architecture (Phase 1)

Everything phase-specific sits behind a boundary; keep it that way.

- **Events repository** (`src/server/repositories/`) — `EventsRepository`
  interface with two impls behind `getEventsRepository()`
  (`src/server/repositories/index.ts`): `DrizzleEventsRepository`
  (Neon serverless Postgres + PostGIS, the default when `DATABASE_URL` is set)
  and `FileEventsRepository` (JSON, seeded from `src/data/seed-events.json`,
  the offline UI-only fallback). Schema + migrations live in `src/server/db/`
  and `drizzle/`; the Drizzle client is a lazy `getDb()`/`getSql()`
  (`src/server/db/client.ts`) so there's no build-time `DATABASE_URL` crash.
- **Importance** (`src/lib/importance.ts`) — pure `importance(event, now)`;
  votes + recency decay now, feed/spatial terms later. Inject `now`, no I/O.
- **Viewport filter** (`src/lib/viewport.ts`) — pure, client-side bounds/category/
  text filters; moves to server-side PostGIS spatial queries in a later phase.
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
  `src/` dir, `@/*` alias, Turbopack. Deploys to **Vercel** (Fluid Compute,
  Node runtime — not edge); Vercel builds natively from source, so there's no
  `output: 'standalone'`.
- **Neon serverless Postgres + PostGIS** via **Drizzle** (`drizzle-orm/neon-http`);
  `drizzle-kit` for migrations. Schema in `src/server/db/schema.ts`.
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

## Local dev & database

- `pnpm dev` on localhost, unchanged in feel. The DB is a **Neon dev branch**:
  run `vercel env pull .env.local` to fetch `DATABASE_URL`, then
  `pnpm db:migrate && pnpm db:seed`. A local Docker Postgres+PostGIS is the
  offline alternative; drop `DATABASE_URL` entirely to fall back to the file store.
- **DB scripts** (package.json): `db:generate` (drizzle-kit generate),
  `db:migrate` (drizzle-kit migrate), `db:seed` (tsx seed), `db:studio`.
- **GOTCHA:** drizzle-kit and tsx do **not** auto-load `.env.local` — only Next
  does. Source `DATABASE_URL` before the `db:*` commands, e.g.
  `export DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d '"')`
  (or use `dotenv-cli`).

## Before you finish a change

Run the same gate CI runs:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
```

Add/adjust tests alongside code: unit/component tests live next to source as
`*.test.ts(x)`; e2e specs live in `e2e/`. Run a single test with
`pnpm test <path-or-name-pattern>` (e.g. `pnpm test utils`) or watch with
`pnpm test:watch`; one e2e spec with `pnpm test:e2e atlas.spec.ts`.

## CI/CD (see README for detail)

- `.github/workflows/ci.yml` — parallel lint/typecheck/test/build/e2e →
  aggregate `ci-success` (the required status check).
- **Deployment is Vercel's Git integration** — no deploy workflow in the repo
  (the old `.github/workflows/deploy.yml` was removed). Vercel builds every push
  natively from source: preview deployments per branch/PR, production on `main`.
  `DATABASE_URL` and the user-agent vars are Vercel environment variables.

## Gotchas

- The e2e test runs `next start` on an uncommon port (3210) to avoid colliding
  with stray dev servers on :3000. Keep it self-contained.
- **DB env isn't auto-loaded by tooling.** Next auto-loads `.env.local`, but
  `drizzle-kit`/`tsx` do not — export `DATABASE_URL` before `db:migrate`/`db:seed`
  (see "Local dev & database").
- **Without `DATABASE_URL` the app falls back to the file store**
  (`FileEventsRepository`), which is offline/UI-only and non-durable. The real
  serving path is Neon Postgres; keep `DATABASE_URL` set in every real env.
- `src/server/db/client.ts` reads `DATABASE_URL` lazily (`getDb()`/`getSql()`),
  so a missing var never crashes the build — it surfaces at first DB use instead.
- `next.config.ts` pins `outputFileTracingRoot`/`turbopack.root` to the project
  so a stray parent-dir lockfile can't misplace the build.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
