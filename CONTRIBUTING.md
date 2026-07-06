# Contributing

Thanks for contributing to **Global**. This document covers the branch model,
commit conventions, and the pull-request process.

## Getting set up

```bash
corepack enable
nvm install        # Node 24, from .nvmrc
pnpm install       # also installs git hooks via husky
```

## Branch naming

Cut short-lived branches from **`develop`**:

- `feature/<short-description>` — new functionality
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — tooling, deps, docs, refactors

`main` and `develop` are protected; never push to them directly.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/), enforced
by commitlint in the `commit-msg` hook:

```
<type>(optional scope): <description>
```

Common types: `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `build`, `refactor`,
`perf`, `style`, `revert`. Examples:

```
feat(map): add layer toggle control
fix: guard against empty geometry
chore: bump next to 16.2.11
```

## Local checks

The `pre-commit` hook runs lint-staged (ESLint `--fix` + Prettier) on staged
files. Before opening a PR, run the full gate that CI runs:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

For end-to-end: `pnpm test:e2e` (installs/uses a chromium browser).

## Pull requests

1. Open your PR against **`develop`** (only release PRs go `develop` → `main`).
2. CI runs automatically; the **`ci-success`** check must be green.
3. Keep your branch up to date with `develop`.
4. Get **one approval** and resolve all conversations.
5. Squash-or-merge once the required check passes.

## Do not

- Commit secrets. Only `.env.example` is tracked; all other `.env*` are ignored.
- Add slow checks (typecheck/tests) to git hooks — those belong in CI.
- Introduce application/map features until the infrastructure phase is signed off.
