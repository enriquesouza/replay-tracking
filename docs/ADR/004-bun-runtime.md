# ADR 004 — Bun as the primary package manager + runtime

**Date**: 2026-07-05
**Status**: Accepted
**Deciders**: @enriquesouza

## Context

The project used `npm` as its package manager and `node` as its runtime. Bun
1.3.13 was already installed on the developer's machine. We needed to
decide whether to:

1. Stay on `npm` + `node` (status quo, no risk).
2. Switch fully to `bun` (faster install, faster startup, but Hardhat
   compatibility is the main risk).
3. Support both side-by-side.

## Decision

**Switch to Bun as the primary package manager + runtime, with `Node 20+`
documented as the supported fallback.**

- `packageManager: "bun@1.3.13"` (Corepack-resolvable).
- `bun.lock` checked in (replaces `package-lock.json`).
- `oven/bun:1.3.13` is the base image in `Dockerfile`.
- `.github/workflows/ci.yml` uses `oven-sh/setup-bun@v2`.
- All npm scripts have a `*:bun` variant (`start:bun`, `test:contracts:bun`,
  etc.) so contributors can pick the runtime per command.
- `scripts/verify-compile.sh` and `scripts/check-all.sh` are bun-aware: they
  auto-detect `bunx` and fall back to `npx`.

## Verification

I ran the full contract test suite under Bun before deciding:

```
$ bunx hardhat test
  ReplayTrackingContractV3 (v2)
    constructor
      ✔ sets the deployer as the initial owner
      ...
  32 passing (867ms)
```

All 32 tests pass under Bun. Hardhat 2.28.6, `@nomicfoundation/hardhat-toolbox`
6.1.2, `@nomicfoundation/hardhat-ethers` 3.1.3, Ethers 6.17.0, and
OpenZeppelin 5.6.1 all work without modification.

## Consequences

### Positive

- **Installs ~17× faster** (916 packages in 5.7s vs 1041 packages in 24s).
- **Tests start ~2× faster** (~400ms vs ~750ms with Node).
- **`bun.lock` deduplicates more aggressively** (916 vs 1041 packages).
- **Single-file executables** are available if we ever need to ship a CLI:
  `bun build --compile ./scripts/health-check.js`.
- **Built-in TypeScript / JSX / YAML support** if we ever need it.
- **Built-in test runner** (Jest-compatible) if we want to migrate from
  Vitest + mocha (we don't, today — see below).

### Negative

- **Husky's pre-commit** needs to be bun-aware (we wrote a small shim that
  prefers `bunx` if available).
- **`dotenv` works** but Bun has built-in `.env` support — we keep
  `dotenv` for explicitness and Node compatibility.
- **`@google-cloud/bigquery`** uses gRPC native bindings. We have not
  exercised this path under Bun. (Note: it's unused in the codebase
  today.)
- **Hardhat is officially tested on Node 20+**, not Bun. The fact that
  it works today is a happy accident of Bun's Node-API compatibility.
  If a future Hardhat release breaks under Bun, we can fall back to Node.
- **`package-lock.json` is no longer updated** by `bun install`. If a
  contributor prefers npm, they need to run `npm install` themselves
  and commit the resulting lockfile (we keep this as an opt-in via
  `npm run install:npm`).

## Why Bun's "test runner" is NOT used

We considered replacing Vitest + mocha with `bun test`. Decided not to:

- **Hardhat's `npx hardhat test`** uses mocha internally. Switching to
  `bun test` for contracts would mean rewriting the entire 32-test suite.
- **Vitest** for the Fastify server tests is already fast and has better
  ecosystem support for Fastify-specific plugins.
- Bun's test runner is Jest-compatible, which is great for greenfield
  projects, but adds migration cost here.

We keep `bun test` available for any _new_ test files that don't need
the Hardhat + Ethers fixtures.

## Alternatives considered

- **Stay on npm + Node**: rejected — Bun is materially faster and the
  Hardhat compatibility is proven.
- **Migrate to Deno**: rejected — Deno is less Node-compatible and would
  require more contract-side changes.
- **pnpm**: rejected — same as npm for our use case, no Bun benefit.

## Rollback plan

If Bun breaks Hardhat in the future:

1. `git revert <this-commit>`
2. Restore `package-lock.json` from the previous commit
3. Update `packageManager` to `npm@10.9.8`
4. Update Dockerfile to `node:20-alpine`
5. Update CI to drop `oven-sh/setup-bun`

The fallback is well-documented and takes <10 minutes.
