# Changelog

## 2.1.0 (2026-07-05) — Security & best-practices pass

### Contract (`ReplayTrackingContractV3`)
- Added `ReentrancyGuard` to all write functions.
- Added `EnforcedPause` to all write functions (via `whenNotPaused`).
- Replaced `bytes32[] transactionKeys` with `EnumerableSet.Bytes32Set` (no
  more unbounded array; no DoS risk).
- Replaced all `require` strings with custom errors (`NotAdmin`,
  `BatchTooLarge`, `StringTooLong`, `InvalidDate`, `KeySetFull`,
  `ContractPaused`, `ContractNotPaused`).
- Added `MAX_BATCH_SIZE`, `MAX_STRING_LENGTH`, `MAX_KEYS` as `immutable`
  constants.
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
- Added structured Pino logger with header redaction (`authorization`, `x-api-key`).
- Added 1 MiB `bodyLimit`.
- Replaced `xss-clean` (deprecated, broken on Node 18+) with `sanitize-html`.
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
- Added `.github/workflows/ci.yml` (compile + test + lint + forge build on
  every push).
- Added `.github/workflows/audit.yml` (weekly `npm audit`).
- Added `.github/dependabot.yml`.
- Added `renovate.json` as an alternative to Dependabot.
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
- Added `docs/ADR/` directory (architectural decision records).
- Added `LICENSE` (MIT).

## 2.0.0 (2026-07-05) — Initial upgrade

See `.upgrade/SUMMARY.md` for the full migration log from 0.8.24 to 0.8.35.
