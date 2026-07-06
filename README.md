# Global

A professional [Next.js](https://nextjs.org) application scaffold with a complete
CI/CD pipeline. This repository currently contains **infrastructure only** — a
minimal placeholder page plus the full tooling, testing, containerization, and
delivery pipeline. Application features come later.

## Stack

| Area        | Choice                                                              |
| ----------- | ------------------------------------------------------------------- |
| Runtime     | Node.js 24 (pinned via `.nvmrc` + `engines`)                        |
| Package mgr | pnpm (via corepack, pinned in `packageManager`)                     |
| Framework   | Next.js 16 (App Router, TypeScript, `src/`, `@/*` alias, Turbopack) |
| Styling     | Tailwind CSS 4                                                      |
| Linting     | ESLint 9 (flat config) + Prettier                                   |
| Unit tests  | Vitest 4 + React Testing Library + jsdom                            |
| E2E tests   | Playwright (chromium smoke test)                                    |
| Git hygiene | Husky + lint-staged + commitlint (Conventional Commits)             |
| Container   | Multi-stage Dockerfile (Next.js standalone) on `node:24-alpine`     |
| Deployment  | GHCR image → self-hosted VPS via `docker compose` behind Caddy      |

## Prerequisites

- **Node.js 24.** With [nvm](https://github.com/nvm-sh/nvm): `nvm install` (reads `.nvmrc`).
- **pnpm via corepack** (ships with Node): `corepack enable`.

```bash
corepack enable
nvm install        # or: nvm use
pnpm install
```

## Scripts

| Script              | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `pnpm dev`          | Start the dev server (Turbopack) on :3000           |
| `pnpm build`        | Production build (standalone output)                |
| `pnpm start`        | Start a built app (prefer the Docker image in prod) |
| `pnpm lint`         | ESLint                                              |
| `pnpm lint:fix`     | ESLint with `--fix`                                 |
| `pnpm format`       | Prettier write                                      |
| `pnpm format:check` | Prettier check (CI)                                 |
| `pnpm typecheck`    | `tsc --noEmit` (strict)                             |
| `pnpm test`         | Vitest run (unit + component)                       |
| `pnpm test:watch`   | Vitest watch mode                                   |
| `pnpm test:e2e`     | Playwright smoke test (builds + serves standalone)  |

The full local gate mirrors CI:

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Project layout

```
src/app/        App Router routes (layout, page, globals.css)
src/lib/        Shared utilities (e.g. cn() class merge)
e2e/            Playwright specs
.github/        CI/CD workflows + a reusable setup composite action
Dockerfile      Multi-stage production image (standalone, non-root)
compose.yaml    VPS stack: app + Caddy reverse proxy (TLS)
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

## CD

`.github/workflows/deploy.yml` runs on push to `main`/`develop`:

1. **build-and-push** — builds the Docker image and pushes it to
   **GHCR** (`ghcr.io/d-wack/global`) using the built-in `GITHUB_TOKEN`. Tags:
   the branch name, `<branch>-<sha>`, and `latest` (on `main`). This runs today,
   with or without a server.
2. **deploy** — **gated**. Skipped entirely unless the repo variable
   `DEPLOY_ENABLED` is `true`. When enabled it uses a GitHub Environment
   (`production` for `main`, `staging` for `develop`), SSHes to the VPS, and runs
   `docker compose pull && docker compose up -d`.

### Enabling deployment later

Deployment is intentionally off until a VPS exists. To turn it on:

1. **Provision the VPS**: install Docker + the compose plugin. Create a deploy
   directory (default `/opt/global`) containing `compose.yaml`, `Caddyfile`, and
   a `.env` (from `.env.example`, with `APP_DOMAIN` set to your real domain).
2. **Create GitHub Environments** `staging` and `production` (repo → Settings →
   Environments). On `production`, enable **Required reviewers** for manual approval.
3. **Add environment secrets** to each: `SSH_HOST`, `SSH_USER`, `SSH_KEY`
   (private key), and optionally `SSH_PORT`.
4. _(Optional)_ set repo/environment variable `DEPLOY_PATH` if not `/opt/global`.
5. **Flip the switch**: set repo variable `DEPLOY_ENABLED=true`
   (`gh variable set DEPLOY_ENABLED --body true`).

The next push to `develop`/`main` will build, push, and deploy (with `production`
gated on your approval). Roll back by re-deploying an older `<branch>-<sha>` tag.

## Container (local sanity check)

```bash
docker build -t global:local .
docker run --rm -p 3000:3000 global:local
# → http://localhost:3000
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and
[CLAUDE.md](CLAUDE.md) for conventions aimed at automated agents.
