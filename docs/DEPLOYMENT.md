# Planet Atlas — Project & Deployment Pipeline

The canonical reference for **what this project is** and **how it ships**. If you're an
agent (`devops-engineer`, `vercel-engineer`) or a human touching CI/CD, deploys, env, or
the database, read this first.

---

## 1. Project at a glance

**Planet Atlas** (repo `d-wack/global`) is a Next.js 16 app: an explorable 3D globe of the
world's news, events, and history, where zoom maps to administrative scale and a left panel
ranks "what matters here now."

- **Live (production):** https://global-jade-tau.vercel.app
- **Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict
  (`noUncheckedIndexedAccess`) · Tailwind 4 · MapLibre GL v5 · **Neon Postgres + PostGIS**
  via **Drizzle** · **Vercel** hosting · pnpm · Node 24.
- **Tests:** Vitest 4 + React Testing Library (jsdom) · one Playwright e2e smoke test.

### Architecture in one screen
Everything phase-specific sits behind a seam, so swaps aren't rewrites:

- **Events store** — `EventsRepository` interface (`src/server/repositories/`). Factory
  `getEventsRepository()` returns **`DrizzleEventsRepository`** (Neon Postgres/PostGIS) when
  `DATABASE_URL` is set, else **`FileEventsRepository`** (JSON, offline/UI-only fallback).
- **DB** — schema in `src/server/db/schema.ts`, migrations in `drizzle/`. The `events` table
  stores `geom geography(Point,4326)` (GiST index), `layer_ids text[]` (GIN), plus
  year/votes/created_at. Client: lazy `getDb()` / `getSql()` (`src/server/db/client.ts`) —
  no build-time `DATABASE_URL` crash.
- **Pure libs** — `importance` (ranking), `viewport` (client bbox/text filter), `timeline`,
  `layers`. Server-only providers behind interfaces: `Geocoder` (Nominatim), `PlaceInfoProvider`
  (Wikipedia), reached only via `/api/*` routes (all `runtime = "nodejs"`).

---

## 2. Environments

| Environment    | Trigger                    | URL                                   | Database                              |
| -------------- | -------------------------- | ------------------------------------- | ------------------------------------- |
| **Local**      | `pnpm dev`                 | `localhost:3000`                      | Neon dev branch (or file fallback)    |
| **Preview**    | any PR / pushed branch     | `global-<hash>-…​.vercel.app` (login) | Neon (env-injected)                   |
| **Production** | merge to **`main`**        | `global-jade-tau.vercel.app` (public) | Neon (env-injected)                   |

Preview URLs require a Vercel login to view (`ssoProtection`); production is public.

---

## 3. The pipeline

```
 feature/* | fix/* | chore/*  ──PR──▶  develop  ──PR──▶  main  ──▶  Vercel PRODUCTION
        │                                  │                          (auto-deploy)
        └── preview deploy per PR          └── preview deploy         every main-merge
                    gate on every PR: ci-success
                    (lint+format:check · typecheck · test · build · e2e)
                    the human merges PRs — protection is not bypassed
```

- **Branch model:** branch from `develop` as `feature/*` / `fix/*` / `chore/*` → PR into
  `develop` → promote with a `develop → main` PR.
- **CI gate** (`.github/workflows/ci.yml`): parallel lint / typecheck / test / build / e2e →
  aggregate **`ci-success`**, the single required status check on `main` and `develop`. The
  **Lint** job runs both `eslint` and **`pnpm format:check`** (Prettier).
- **CD is Vercel's native Git integration** — connected to `d-wack/global`, **production
  branch = `main`**. There is **no deploy workflow in the repo**. Merge to `main` → production
  deploy; every PR/branch → preview deploy. Nothing to run by hand for a normal release.
- **Merging:** the human merges PRs in the GitHub UI (branch protection requires
  `ci-success`; do not `--admin`-bypass). GitHub merge commits are authored as `d-wack`, which
  authorizes the Vercel deploy (see §5).

### Doing a release
1. Open a `develop → main` PR. 2. Wait for `ci-success`. 3. Merge it. 4. Vercel deploys
production automatically; watch it reach `READY`, then smoke-test the live site.

### Manual / one-off deploys (rare — `vercel-engineer`)
`vercel deploy` (preview) for a one-off; `vercel --prod` **only** when explicitly asked.
Rollback by promoting a previous deployment (`vercel promote <url>`) or reverting the merge.

---

## 4. Environment variables & secrets

**Vercel project env is the source of truth** (the Neon integration set `DATABASE_URL` for
all environments):

| Var                    | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `DATABASE_URL`         | Neon pooled connection (Drizzle runtime) |
| `NOMINATIM_USER_AGENT` | server-side geocoding contact string     |
| `WIKIPEDIA_USER_AGENT` | server-side place-info contact string    |

- Sync locally with `vercel env pull .env.local`.
- **Never commit** `.env`, `.env.local`, or `.vercel/` (all gitignored). `VERCEL_TOKEN` lives
  only in the gitignored `.env`; never print or commit it.

---

## 5. Git-author authorization (important)

Vercel **Git Fork Protection is ON**: it only builds commits whose Git author is a recognized
Vercel team member. This repo's git author is set to **`d-wack`**
(`54122829+d-wack@users.noreply.github.com`) — the Vercel-connected identity — so automated
commits authorize.

- **Symptom:** a deployment shows **`BLOCKED`** / the PR's **Vercel** check fails with
  *"Git author … must have access to the project"* or *"Deployment was blocked."*
- **Cause:** the commit's author isn't a Vercel member (e.g. a different GitHub identity).
- **Fix:** author commits as `d-wack`, or add that identity to the Vercel team. **Do not**
  disable Git Fork Protection to work around it.

---

## 6. Database & migrations

Neon Postgres + PostGIS. Migrations are **run manually against the target Neon branch** (they
are not part of CD).

| Script          | Does                                          |
| --------------- | --------------------------------------------- |
| `pnpm db:generate` | drizzle-kit generate (diff schema → SQL)   |
| `pnpm db:migrate`  | apply pending migrations                    |
| `pnpm db:seed`     | idempotent seed of the demo events          |
| `pnpm db:studio`   | Drizzle Studio                              |

**Gotcha:** drizzle-kit and tsx do **not** auto-load `.env.local` — only Next does. Source the
connection first, and use the **unpooled** URL for DDL:

```bash
# migrate (DDL — unpooled)
export DATABASE_URL=$(grep '^DATABASE_URL_UNPOOLED=' .env.local | cut -d= -f2- | tr -d '"')
pnpm db:migrate
# seed (pooled is fine)
export DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d '"')
pnpm db:seed
```

---

## 7. Local development

```bash
vercel env pull .env.local          # gets DATABASE_URL (+ user-agents)
pnpm db:migrate && pnpm db:seed     # against your Neon dev branch (see §6 gotcha)
pnpm dev                            # localhost:3000
```

Offline: drop `DATABASE_URL` to use the file store (UI-only), or run a local Docker
Postgres+PostGIS. **Before finishing any change, run the full gate:**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
```

`format:check` is easy to forget and CI-enforced — it catches Prettier issues `eslint` doesn't.

---

## 8. Troubleshooting (things we actually hit)

- **`format:check` fails in CI but `lint` passed locally** → you only ran `eslint`. Run the
  full gate incl. `pnpm format:check`. (The Claude GitHub App's `claude*.yml` workflow files
  are `.prettierignore`'d — they're generated, not hand-formatted.)
- **Deployment `BLOCKED` / Vercel check red** → git-author authorization (§5).
- **Preview URL returns a login page** → `ssoProtection` protects previews; that's expected.
  Production is public.
- **App 500s on Vercel with a filesystem error** → `DATABASE_URL` isn't set, so it fell back to
  the file store, which can't write on serverless. Ensure `DATABASE_URL` is in the Vercel env.
- **`vercel deploy` hangs on upload** → a huge file is being uploaded; keep `.vercelignore`
  excluding `GDELT*.TXT`, `graphify-out/`, etc.
- **Never push to `main` directly** → it deploys immediately. Always go through a
  `develop → main` PR so production ships the intended, migrated state.

---

## 9. Ownership

- **`devops-engineer`** — CI, the branch/PR pipeline, build config, repo plumbing.
- **`vercel-engineer`** — the Vercel platform: deploys, env, logs, rollback, integrations, cron,
  firewall.

Both agents treat this document as the canonical pipeline reference.
