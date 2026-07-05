# Domain 8 — Deployment, infrastructure, multi-chain support (10 tasks)

## Tasks 71–80

### Task 71: `hardhat.config.js` `production` network
- `hardhat.config.js` already has a `localhost` and `camp-network-testnet` network.
- Added `chainId`, `accounts` (from `DEPLOYER_PRIVATE_KEY`), and explicit RPC URLs.

### Task 72: `scripts/deploy-contract-verify.js`
- `npm run deploy:verify` deploys AND submits the source for verification on Etherscan/Blockscout.
- Waits 5 confirmations before verifying.

### Task 73: `scripts/check-balance.js`
- `npm run balance:check` reads `DEPLOYER_PRIVATE_KEY`, prints the address + balance, exits 1 if balance < 0.01 ETH.

### Task 74: Multi-chain RPC config
- `RPC_URL` (default for prod), `CAMP_RPC_URL` (Camp Network), `LOCAL_RPC_URL` (local node), `FORK_URL` (for `anvil --fork-url`).

### Task 75: `scripts/health-check.js`
- `npm run health:rpc` pings every configured RPC and reports latency.
- Exits 0 if at least one is healthy, 1 otherwise.

### Task 76: `Dockerfile` (multi-stage)
- Build stage: `node:20-alpine` + `npm ci` + `npm run compile`.
- Runtime stage: copies only the production node_modules + compiled artifacts.
- Non-root user, exposed port 3000, `HEALTHCHECK` against `/health`.

### Task 77: `docker-compose.yml`
- (Not added in v2 — would require a postgres service for the report generator; punted to v3.)

### Task 78: Kubernetes manifests
- (Not added — the user didn't request it; documented in `docs/RUNBOOK.md` for future work.)

### Task 79: Terraform notes
- (Not added — not in scope; README points to the docs for future work.)

### Task 80: CI secrets rotation note
- Documented in `docs/DEPLOYMENT.md` and `docs/SECURITY.md`.
