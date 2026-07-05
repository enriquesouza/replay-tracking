# Domain 6 — Dependency audit, lockfile, secret management (10 tasks)

## Tasks 51–60

### Task 51: `.env.example` with every variable the code reads
- `X_API_KEY`, `JWT_SECRET`, `COOKIE_SECRET`, `CORS_ALLOWED_ORIGINS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`, `RATE_LIMIT_ALLOWLIST`, `RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `CONTRACT_ADDRESS`, `ETHERSCAN_API_KEY`, `GAS_PRICE_API`, `LOCAL_RPC_URL`, `CAMP_RPC_URL`, `FORK_URL`, `TRUST_PROXY`, `LOG_LEVEL`, `PORT`, `HOST`, `NODE_ENV`.

### Task 52: `package.json#engines.node >= 20`
- Hard requirement for Node 20+ (BigInt, `crypto.randomUUID`, `AbortController` improvements).

### Task 53: `package.json#packageManager`
- Pinned to `npm@10.9.8`.

### Task 54: `package.json#overrides`
- Pin `fastify ^4.28.1` and `cookie ^0.7.0` to avoid known-vulnerable transitive versions.

### Task 55: `LICENSE` (MIT)
- Standard MIT license, copyright 2026 Enrique Souza.

### Task 56: `SECURITY.md` (root)
- Email-based vulnerability reporting flow.

### Task 57: `.nvmrc` (Node 20)
- `nvm use` will pick the right version.

### Task 58: `Dockerfile` (multi-stage)
- Build stage compiles contracts; runtime stage prunes devDeps.
- Non-root user (`app`).
- `HEALTHCHECK` against `/health`.

### Task 59: `.dockerignore`
- Excludes `node_modules`, `artifacts`, `cache`, `out`, `.git`, `.github`, `.idea`, `.vscode`, `.upgrade`, `.venv`, `*.log`, `.DS_Store`, `.env*`.

### Task 60: `npm audit` script with thresholds
- `npm run audit` → `npm audit --audit-level=moderate` (fails on moderate+).
- `npm run audit:fix` → `npm audit fix`.

## Verification

- `npm install` — clean.
- `npm audit --audit-level=moderate` — exit 0.
- `.env.example` has 20+ documented vars.
