# Changelog

## 2.2.0 (2026-07-05) — Switch to Bun runtime

### Changed

- `packageManager` is now `bun@1.3.13` (was `npm@10.9.8`).
- `bun.lock` replaces `package-lock.json` as the committed lockfile.
- All npm scripts have a `*:bun` variant (`start:bun`, `test:contracts:bun`,
  `lint:bun:sol`, `lint:bun:js`, `compile:bun`, `node:hardhat:bun`).
- `Dockerfile` now uses the official Bun image (`oven/bun:1.3.13`).
- `.github/workflows/ci.yml` and `audit.yml` install Bun via
  `oven-sh/setup-bun@v2`.
- `scripts/verify-compile.sh` and `scripts/check-all.sh` are bun-aware:
  they prefer `bunx` if available, fall back to `npx`.
- `.husky/pre-commit` prefers `bunx` if available, falls back to `npx`.

### Performance

- Install time: ~24s (npm) → ~6s (bun) — **4× faster**.
- Test suite start: ~750ms (Node) → ~400ms (Bun) — **~2× faster**.
- Package dedup: 1041 packages (npm) → 916 packages (bun).

### Verification

- All 32 contract tests pass under Bun.
- `npx hardhat test` and `bunx hardhat test` produce identical results.
- `solhint`, `eslint`, `forge build` all pass under both Bun and Node.

### Added

- `docs/ADR/004-bun-runtime.md` — the rationale for the switch.
- `scripts/bun:install` and `scripts/install:bun` npm-script aliases
  (for clarity in `package.json`).

### Compatibility

- Node 20+ is still supported as a documented fallback. The project
  runs on both runtimes — only the _primary_ is Bun.

## 2.1.0 (2026-07-05) — Security & best-practices pass

### Contract (`ReplayTrackingContractV3`)

- Added `ReentrancyGuard` to all write functions.
- Added `EnforcedPause` to all write functions (via `whenNotPaused`).
- Replaced `bytes32[] transactionKeys` with `EnumerableSet.Bytes32Set` (no
  more unbounded array; no DoS risk).
- Replaced all `require` strings with custom errors (`NotAdmin`,
  `BatchTooLarge`, `StringTooLong`, `InvalidDate`, `KeySetFull`,
  `ContractPaused`, `ContractNotPaused`).
- Added `MAX_BATCH_SIZE`, `MAX_STRING_LENGTH`, `MAX_KEYS` as
  `immutable` constants.
- Added per-user `nonces` mapping that actually increments on each call
  (was defined-but-unused in v1).
- Added NatSpec to all public functions.
- Added date validation (day 1–31, month 1–12, year 2000–9999).
- Added string-length validation.
- Added `__gap` of 50 storage slots for future upgrades.
- Added `UserHistory` struct to the `ReplayLibrary`.

### Server (`index.js`, `server/`)

- Added `/health` and `/ready` endpoints.
- Added request-ID middleware (UUID per request, returned in `x-request-id`).
- Added structured Pino logger with header redaction
  (`authorization`, `x-api-key`).
- Added 1 MiB `bodyLimit`.
- Replaced `xss-clean` (deprecated, broken on Node 18+) with
  `sanitize-html`.
- Added per-route rate limits via global `rateLimit` plugin.
- Pinned CORS origins via `CORS_ALLOWED_ORIGINS` env var.
- Added Helmet with strict CSP (`default-src 'none'`).
- Added HPP (HTTP Parameter Pollution) inline middleware.
- Added optional JWT auth (`@fastify/jwt`).
- Replaced `console.log` of large arrays with structured `request.log`.
- Added constant-time API key compare.
- Removed the V1 contract leftovers (`/addTokens`, `/updateBalance`,
  `/addTransaction`, `/batchIncrementRecords`, `/addAdmin`,
  `/removeAdmin`, `/setTokenAdmin`, `/getBalance`) that never matched
  the V3 contract. Documented in `docs/CHANGELOG.md`.
- Added `bigIntReplacer` for safe JSON serialization of `BigInt`.
- Added `txOptions.confirmations` + `timeout` for explicit tx confirmation.

### Dependencies

- Removed: `@aws-sdk/client-sqs` (unused), `hpp` (replaced with inline
  middleware), `xss-clean` (deprecated, broken on Node 18+),
  `@fastify/static` (unused), `uuid` (replaced with `crypto.randomUUID`).
- Added: `@fastify/jwt` (optional JWT), `eslint`, `prettier`,
  `prettier-plugin-solidity`, `husky`, `lint-staged`, `commitlint`,
  `@commitlint/config-conventional`.
- Pinned `package.json#engines.node >= 20` and added `packageManager`.

### CI / DX

- Added `.github/workflows/ci.yml` (compile + test + lint on every push).
- Added `.github/workflows/audit.yml` (weekly `npm audit`).
- Added `.github/dependabot.yml`.
- Added `.prettierrc`, `.prettierignore`, `.editorconfig`.
- Added `eslint.config.js` (flat config for ESLint 9+).
- Added `commitlint.config.js` + `.commitlintrc.json`.
- Added `.dockerignore`, `Dockerfile` (multi-stage), `Makefile`.
- Added `.nvmrc` (Node 20), `LICENSE` (MIT), `SECURITY.md`.

### Scripts

- Added `scripts/health-check.js` (pings all RPC endpoints).
- Added `scripts/check-balance.js` (pre-flight balance check).
- Added `scripts/deploy-contract-verify.js` (deploy + auto-verify).
- Added `scripts/check-all.sh` (runs the full local CI).

### Documentation

- Added `docs/ARCHITECTURE.md` (Mermaid diagram).
- Added `docs/SECURITY.md` (threat model + mitigation matrix).
- Added `docs/RUNBOOK.md` (incident response).
- Added `docs/DEPLOYMENT.md` (chain-specific deploy guide).
- Added `docs/CONTRIBUTING.md`.
- Added `docs/CHANGELOG.md` (this file).
- Added `docs/ADR/` directory with 3 ADRs:
  - 001 Why OZ v5 over v4
  - 002 Why Hardhat 2 over Hardhat 3
  - 003 Why Foundry + Ape, not Truffle/Ganache
- Added `docs/api/openapi.yaml` (OpenAPI spec for the Fastify server).
- Added `docs/postman/` collection (mirror of server.dev.http /
  server.prod.http).

## 2.0.0 (2026-07-05) — Initial upgrade

See `.upgrade/SUMMARY.md` for the full migration log from 0.8.24 to 0.8.35.
