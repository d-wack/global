# Planet Atlas

An explorable 3D globe of the world's news, events, and history, built on
[Next.js](https://nextjs.org). Zoom maps to administrative scale and a left panel
ranks "what matters here now." See [Overview.md](Overview.md) for the product
vision and roadmap.

**Status:** Phase 0 (infrastructure + CI/CD) is complete, and Phase 1's first
vertical slice is in — a MapLibre globe, a Postgres events store (Neon + PostGIS
via Drizzle), click-to-add, voting, a viewport-ranked panel, and typed geocode
search. It deploys to Vercel. Data sources (GDELT, Wikidata) and server-side
spatial queries come in later phases, behind existing seams.

## Stack

| Area        | Choice                                                                   |
| ----------- | ------------------------------------------------------------------------ |
| Runtime     | Node.js 24 (pinned via `.nvmrc` + `engines`)                             |
| Package mgr | pnpm (via corepack, pinned in `packageManager`)                          |
| Framework   | Next.js 16 (App Router, TypeScript, `src/`, `@/*` alias, Turbopack)      |
| Styling     | Tailwind CSS 4                                                           |
| Database    | Neon serverless Postgres + PostGIS via Drizzle (`drizzle-orm/neon-http`) |
| Linting     | ESLint 9 (flat config) + Prettier                                        |
| Unit tests  | Vitest 4 + React Testing Library + jsdom                                 |
| E2E tests   | Playwright (chromium smoke test)                                         |
| Git hygiene | Husky + lint-staged + commitlint (Conventional Commits)                  |
| Deployment  | Vercel (Fluid Compute, Node runtime; Git-integration CD)                 |

## Prerequisites

- **Node.js 24.** With [nvm](https://github.com/nvm-sh/nvm): `nvm install` (reads `.nvmrc`).
- **pnpm via corepack** (ships with Node): `corepack enable`.
- **Vercel CLI** (`pnpm dlx vercel` or `npm i -g vercel`) to pull the database URL.

```bash
corepack enable
nvm install        # or: nvm use
pnpm install
```

### Database (Neon Postgres + PostGIS)

The app serves events from **Neon serverless Postgres** (with PostGIS) via
Drizzle. Local dev uses a **Neon dev branch**; pull its `DATABASE_URL`, run the
migration (it enables PostGIS and creates the `events` table), then seed:

```bash
vercel link                 # once, to associate this repo with the Vercel project
vercel env pull .env.local  # writes DATABASE_URL (+ user-agent vars)

# drizzle-kit/tsx don't auto-load .env.local — source it first:
export DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d '"')

pnpm db:migrate             # apply migrations (enables PostGIS, creates events)
pnpm db:seed                # load src/data/seed-events.json
```

**Offline alternative:** run a local Docker Postgres+PostGIS and point
`DATABASE_URL` at it, or drop `DATABASE_URL` entirely to fall back to the
file-backed store (UI-only, non-durable — for offline UI work).

## Scripts

| Script              | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `pnpm dev`          | Start the dev server (Turbopack) on :3000          |
| `pnpm build`        | Production build                                   |
| `pnpm start`        | Start a built app locally                          |
| `pnpm lint`         | ESLint                                             |
| `pnpm lint:fix`     | ESLint with `--fix`                                |
| `pnpm format`       | Prettier write                                     |
| `pnpm format:check` | Prettier check (CI)                                |
| `pnpm typecheck`    | `tsc --noEmit` (strict)                            |
| `pnpm test`         | Vitest run (unit + component)                      |
| `pnpm test:watch`   | Vitest watch mode                                  |
| `pnpm test:e2e`     | Playwright smoke test (builds + `next start`)      |
| `pnpm db:generate`  | Generate a Drizzle migration from schema changes   |
| `pnpm db:migrate`   | Apply migrations to `DATABASE_URL`                 |
| `pnpm db:seed`      | Seed the database from `src/data/seed-events.json` |
| `pnpm db:studio`    | Open Drizzle Studio against `DATABASE_URL`         |

The full local gate mirrors CI:

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
```

## Running the atlas

`pnpm dev` (after the database setup above), then open the app. Notes:

- **Events store.** Events persist to **Neon Postgres + PostGIS** via Drizzle,
  behind the `EventsRepository` seam. The repository factory
  (`src/server/repositories/index.ts`) selects `DrizzleEventsRepository` when
  `DATABASE_URL` is set (all Vercel envs + local Neon dev branch), and otherwise
  falls back to the file-backed `FileEventsRepository` for offline UI-only work.
- **Geocoding.** Typed place search calls OpenStreetMap **Nominatim** server-side
  (no key). Their usage policy requires an identifying `User-Agent` — set
  `NOMINATIM_USER_AGENT`. See `.env.example`.
- **Basemap.** Keyless CARTO dark raster tiles; swap the constant in
  `src/config/map.ts` for vector/keyed tiles later.

## Project layout

```
src/app/           App Router routes + API handlers (events, geocode)
src/components/     Globe, panel, add, search UI (client)
src/state/         React context (single source of client state)
src/hooks/         Data hook (useEvents)
src/lib/           Pure logic: importance, viewport filters, zod schemas, cn()
src/server/        Server-only: events repository + db + geocoder (the swap seams)
src/server/db/     Drizzle schema + lazy Neon client (getDb/getSql) + seed
src/config/        Basemap, data-path, geocoder constants
src/data/          Committed seed events
src/types/         Domain model (AtlasEvent)
drizzle/           Generated SQL migrations (PostGIS + events table)
e2e/               Playwright specs
.github/           CI workflow + a reusable setup composite action
```

## Branch model

- **`main`** — production. Protected. Deploys to the `production` environment.
- **`develop`** — integration/staging. Protected. Deploys to `staging`.
- **`feature/*`, `fix/*`, `chore/*`** — short-lived branches, opened as PRs into `develop`.

Both `main` and `develop` require a PR, a passing **`ci-success`** check, an
up-to-date branch, one approval, and resolved conversations before merge.

## Commit convention

[Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint via the `commit-msg` hook. Examples: `feat: …`, `fix: …`, `chore: …`,
`ci: …`, `docs: …`, `test: …`, `build: …`.

## CI

`.github/workflows/ci.yml` runs on PRs and pushes to `main`/`develop`. Parallel
jobs — **lint**, **typecheck**, **test** (with coverage), **build**, **e2e** —
feed a single aggregate **`ci-success`** job, which is the one required status check.

## Deployment (Vercel)

Deployment is handled by **Vercel's Git integration** — there's no deploy
workflow in the repo. Vercel builds every push natively from source (Next.js on
Fluid Compute, Node runtime):

- **Preview** deployments for every branch and pull request.
- **Production** deployment on push to `main`.

Roll back from the Vercel dashboard (instant promotion of a previous
deployment). Environment variables (`DATABASE_URL` from the Neon integration,
plus `NOMINATIM_USER_AGENT` / `WIKIPEDIA_USER_AGENT`) are configured per Vercel
environment; pull them locally with `vercel env pull .env.local`. Database
migrations (`pnpm db:migrate`) are run against the target Neon branch, not by the
build.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and
[CLAUDE.md](CLAUDE.md) for conventions aimed at automated agents.
