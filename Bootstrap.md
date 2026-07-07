# Project bootstrap: CI/CD pipeline first, app features later

You are setting up a brand-new professional Next.js project. This session is **infrastructure and pipeline only** — do NOT build any application/map features yet. The goal is a clean repo with a fully working CI pipeline (green on first run) and a complete CD pipeline that is written but safely gated off until a production server exists.

Repo: this is a fresh GitHub repo. Package manager: **pnpm** (via corepack). Deployment target (later): a self-hosted VPS via Docker image on GHCR + SSH. For now the app runs locally only.

Work methodically. After each major step, run the relevant checks locally and confirm they pass before moving on. At the end, give me a summary and a checklist of the manual steps only I can do.

## Target stack (use current stable versions — verify, don't assume)

- Node.js **24 LTS** (pin via `.nvmrc` and `package.json` `engines`; enable pnpm with corepack)
- Next.js **16** (App Router, TypeScript, ESLint, Tailwind, `src/` dir, `@/*` import alias) via `create-next-app@latest`. Turbopack is the default bundler.
- ESLint 9 flat config (`eslint.config.mjs`) — `next lint` is removed; wire eslint directly through a `lint` script.
- Prettier (+ `prettier-plugin-tailwindcss`, `eslint-config-prettier`)
- Vitest + React Testing Library (+ jsdom) for unit tests
- Playwright for a single E2E smoke test
- Husky + lint-staged + commitlint (Conventional Commits)

## Step 1 — Scaffold

1. Run `create-next-app@latest .` with: TypeScript, ESLint, Tailwind, App Router, `src/`, import alias `@/*`, pnpm. Turbopack default is fine.
2. Add `.nvmrc` (`24`), set `engines.node` (`>=24 <25`) and the `packageManager` field. Commit the pnpm lockfile.
3. Set `output: 'standalone'` in `next.config` (needed for the Docker image).
4. Add a minimal placeholder home page (a single heading naming the project) — nothing more. No map, no features.

## Step 2 — Code quality tooling

1. Prettier config + `.prettierignore`; add `format` and `format:check` scripts. Ensure eslint-config-prettier is applied so ESLint and Prettier don't fight.
2. Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`). Add a `typecheck` script (`tsc --noEmit`).
3. `.editorconfig`.
4. Scripts in `package.json`: `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `test`, `test:watch`, `test:e2e`.

## Step 3 — Testing

1. Configure Vitest with jsdom + RTL. Add one trivial unit test (e.g. a `cn`/utils helper) and one component test rendering the home page — both must pass.
2. Configure Playwright with a `webServer` that builds+serves the app; add one smoke test asserting the home page loads and shows the heading. Keep it to one test.

## Step 4 — Git hooks & commit hygiene

1. Husky v9: `pre-commit` runs lint-staged (eslint --fix + prettier on staged files); `commit-msg` runs commitlint with `@commitlint/config-conventional`.
2. lint-staged config for `*.{ts,tsx,js,jsx,json,css,md}`.
3. Do NOT put slow checks (typecheck/tests) in hooks — those belong in CI.

## Step 5 — CI (`.github/workflows/ci.yml`)

- Triggers: `pull_request` → `main`, `develop`; and `push` → `develop`, `main`.
- Use `concurrency` to cancel superseded runs.
- Setup: checkout, pnpm via corepack, `actions/setup-node` reading `.nvmrc` with pnpm cache. Use the **current major version** of each official action (verify against the marketplace).
- Parallel jobs: `lint` (eslint + prettier check), `typecheck`, `test` (vitest run + coverage), `build` (`next build`), `e2e` (playwright, installs browsers, its own job).
- Add a final **`ci-success`** job that `needs` all of the above — this single check is what branch protection will require.
- The pipeline must be **green on the first run** against the scaffold.

## Step 6 — Containerization

1. Multi-stage `Dockerfile` on `node:24-alpine`, using Next.js standalone output, running as a non-root user, exposing the app port.
2. `.dockerignore`.
3. `compose.yaml` for the VPS with the app service (env-driven) and a **Caddy** reverse proxy service for automatic TLS; include a minimal `Caddyfile`. These are only exercised at deploy time.

## Step 7 — CD (`.github/workflows/deploy.yml`) — ready but gated

Structure into two jobs:

1. **build-and-push** (runs on `push` to `develop` and `main`): builds the image and pushes to **GHCR** using the built-in `GITHUB_TOKEN` (`packages: write`). Tag by branch + short SHA (and `latest` for main). This should work immediately, even before the VPS exists.
2. **deploy** (gated): runs only when repo variable `DEPLOY_ENABLED == 'true'`. Uses a GitHub **Environment** (`staging` for develop, `production` for main) that holds SSH secrets (`SSH_HOST`, `SSH_USER`, `SSH_KEY`, optional `SSH_PORT`). The `production` environment should be configured to require manual approval. The deploy step SSHes to the VPS and runs `docker compose pull && docker compose up -d`.

- Because `DEPLOY_ENABLED` is unset now, the deploy job is skipped and the pipeline stays green. Document how to flip it on later.

## Step 8 — Branch model & protection

1. Bootstrap: commit Steps 1–7 to `main`, push, then create and push a `develop` branch.
2. Apply branch protection to **both** `main` and `develop` using the `gh` CLI (require PR before merge, require the `ci-success` status check, require branches up to date, require 1 approval, require conversation resolution, block force-push and deletion). If `gh` can't authenticate, output a `scripts/setup-branch-protection.sh` I can run myself, and tell me exactly what it does.
3. Prove the flow: create a small `chore/` feature branch, open a PR into `develop`, and confirm CI runs and the branch is blocked until `ci-success` passes.

## Step 9 — Docs (also serve as agent onboarding)

- `README.md`: stack, prerequisites (Node 24 via nvm, pnpm via corepack), all scripts, the branch model, commit convention, how CI/CD works, and the exact steps to enable deployment later (add environment secrets, set `DEPLOY_ENABLED=true`).
- `CONTRIBUTING.md`: branch naming (`feature/*`, `fix/*`, `chore/*`), Conventional Commits, PR process.
- `CLAUDE.md`: project conventions, stack, and workflow rules for future agent sessions. If `create-next-app` generated an `AGENTS.md`, keep the two consistent (or have one reference the other).

## Constraints

- No application/map features this session.
- No secrets committed — only `.env.example`. Ensure `.env*` (except `.env.example`) is gitignored.
- Make small, logically-scoped commits with Conventional Commit messages.
- Prefer current stable major versions of all actions and deps; verify rather than guessing.

## Definition of done

- `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass locally.
- CI is green on a PR into `develop`.
- CD workflow builds+pushes an image to GHCR on merge to `develop`, with the deploy job skipped (gated).
- `main` and `develop` are protected and require `ci-success`.
- README/CONTRIBUTING/CLAUDE.md are written.
- End with a summary + a checklist of manual steps left for me.
