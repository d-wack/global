# CLAUDE.md

Guidance for automated agents (and humans) working in this repository.

## What this project is

**Global** — a Next.js 16 application. Right now the repo is **infrastructure
only**: a minimal placeholder page plus a full CI/CD pipeline. Do **not** add
application/map features unless explicitly asked; the current phase is pipeline
and tooling.

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
`*.test.ts(x)`; e2e specs live in `e2e/`.

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
