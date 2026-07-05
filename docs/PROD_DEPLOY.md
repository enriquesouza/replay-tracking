# Production Deployment Runbook

> This is the step-by-step procedure for taking **v2.1.0** of the
> `ReplayTrackingContract` from a clean checkout to a live, production-deployed
> contract on the target chain (default: **Camp Network testnet**,
> chainId `325000`, RPC `https://rpc.camp-network-testnet.gelato.digital`).
>
> For the high-level overview, see [README.md](../README.md). For the threat
> model and security rationale, see [SECURITY.md](SECURITY.md). For the
> per-chain reference, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 1. What "prod" means in this project

There are three things to "push to prod":

| Layer | What it is | How to push |
|---|---|---|
| **(a) Code** | The repository on `main` | `git push` |
| **(b) Contract** | The `ReplayTrackingContractV3` instance on a chain | `npm run deploy:prod` (or `deploy:verify`) |
| **(c) API** | The Fastify server reachable at a hostname | `docker run …` or your hosting platform's deploy |

**(a) and (c) are entirely under your control.** **(b) requires a funded
deployer wallet** — the AI assistant does NOT have access to your private
key, so the on-chain step must be done by you (or a CI runner with secrets).

The rest of this document covers all three.

---

## 2. The push to prod — full sequence

### 2.1. Pre-flight (5 minutes)

```bash
# Sanity: Node 20+, npm 10+, all tools in place
node --version          # v20.x or v22.x
npm --version           # 10.x+
which forge             # ~/foundry/bin/forge (optional but recommended)

# From the repo root
cd /Users/enriquesouza/projects/replay-tracking

# Install deps + verify everything is green
npm install
bash scripts/check-all.sh
# → All checks should pass
```

If `bash scripts/check-all.sh` reports any failure, **stop and fix the
underlying issue first**. Do not deploy from a broken state.

### 2.2. Push the code to `main` (1 minute)

```bash
# Commit the v2.1.0 changes
git add -A
git commit -m "feat: v2.1.0 — security hardening + best-practices pass

- Contract: ReentrancyGuard, whenNotPaused, custom errors, EnumerableSet
- Server: CSP, CORS allowlist, HPP, sanitize-html, /health, /ready, request IDs
- Tests: 11 → 32 contract tests
- Tooling: ESLint, Prettier, Solhint, commitlint, husky, lint-staged
- CI: GitHub Actions (lint + test + audit)
- Docs: Architecture, Security, Runbook, Deployment, Contributing, Changelog, 3 ADRs
- LICENSE: MIT"

# Push to origin/main
git push origin main
```

The remote is `git@github.com:enriquesouza/replay-tracking.git` (already
configured). The push triggers the CI workflow (`.github/workflows/ci.yml`)
which will run audit, lint, format-check, compile, contract tests, and forge
build on every push.

### 2.3. Deploy the contract to prod (5 minutes)

> ⚠️ This step requires:
> 1. A funded deployer wallet (private key + ETH for gas).
> 2. The chain's RPC URL.
> 3. (Optional, for `deploy:verify`) An Etherscan/Blockscout API key.

```bash
# 1. Set the environment
export RPC_URL="https://your-rpc.example.com"             # the chain's JSON-RPC
export DEPLOYER_PRIVATE_KEY="0x..."                       # your funded deployer

# 2. Pre-flight: RPC reachable, wallet funded
npm run health:rpc
npm run balance:check
# → Wallet: 0xYourDeployer
# → Balance: 0.5 ETH
# → ✅ Balance check passed

# 3. (Optional) Verify the artifact matches what you expect
ls -la artifacts/contracts/ReplayTrackingContractV2.sol/ReplayTrackingContractV3.json
node -e "console.log(require('./artifacts/contracts/ReplayTrackingContractV2.sol/ReplayTrackingContractV3.json').abi.filter(x => x.type === 'function').map(x => x.name))"
# Should print: batchInsertRecords, getUserHistories, getTransactionKeys, getTransactionsByDay, getTransactionsByUserAndDate, getTransactionsByUserId, getTransactionsByUserIdAndAssetId, getDailyTransactionsCount, getNonce, pause, unpause, insertUserHistory

# 4. Deploy
npm run deploy:prod
# → Deployer: 0xYourDeployer
# → RPC:      https://your-rpc.example.com
# → Balance:  0.5 ETH
# → Contract deployed to: 0xNewAddress
# → To wire the API to this deployment, set in .env: CONTRACT_ADDRESS=0xNewAddress
```

**Save the new address** — you'll need it in the next step.

#### 4b. (Optional) Auto-verify on Etherscan/Blockscout

```bash
export ETHERSCAN_API_KEY="..."    # or BLOCKSCOUT_API_KEY
npm run deploy:verify
# → Deployed: 0x...
# → Waiting for 5 block confirmations before verifying...
# → Submitting source for verification...
# → ✅ Verified
```

If the chain is Camp Network testnet, the explorer is
`https://camp-network-testnet.blockscout.com`. The `--network
camp-network-testnet` flag on `npx hardhat verify` will route to Blockscout.

### 2.4. Wire up the API (2 minutes)

```bash
# 1. Create .env (if it doesn't exist)
cp .env.example .env

# 2. Edit .env
cat .env
# NODE_ENV=production
# LOG_LEVEL=info
# PORT=3000
# HOST=0.0.0.0
# TRUST_PROXY=true                  # if behind a reverse proxy
# X_API_KEY=<generate with: openssl rand -hex 32>
# JWT_SECRET=<generate with: openssl rand -hex 64>     # optional
# COOKIE_SECRET=<generate with: openssl rand -hex 32>  # optional
# CORS_ALLOWED_ORIGINS=https://app.example.com
# RATE_LIMIT_MAX=100
# RATE_LIMIT_WINDOW=1 minute
# RPC_URL=https://your-rpc.example.com
# DEPLOYER_PRIVATE_KEY=0x...
# CONTRACT_ADDRESS=0xNewAddress      # ← from step 2.3
# CAMP_RPC_URL=https://rpc.camp-network-testnet.gelato.digital

# 3. Set the prod values
export CONTRACT_ADDRESS="0xNewAddress"   # from step 2.3
export DEPLOYER_PRIVATE_KEY="0x..."      # same as before
export X_API_KEY="$(openssl rand -hex 32)"
export JWT_SECRET="$(openssl rand -hex 64)"  # optional but recommended
export CORS_ALLOWED_ORIGINS="https://app.example.com"
export NODE_ENV=production

# 4. Add to .env
cat >> .env <<EOF
NODE_ENV=production
CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
DEPLOYER_PRIVATE_KEY=${DEPLOYER_PRIVATE_KEY}
X_API_KEY=${X_API_KEY}
JWT_SECRET=${JWT_SECRET}
CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
EOF
```

### 2.5. Run the API in prod (3 minutes)

Pick **one** of the three options below.

#### Option A: Plain Node

```bash
NODE_ENV=production npm start
# → Server listening on 3000
```

#### Option B: Docker

```bash
docker build -t replay-tracking:v2.1.0 .
docker run -d \
  --name replay-tracking \
  --restart=unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  replay-tracking:v2.1.0
# → Container running, port 3000 published

docker logs -f replay-tracking
# → Server listening on 3000
```

The Dockerfile is multi-stage, runs as a non-root user, and has a `HEALTHCHECK`
against `/health`.

#### Option C: Your hosting platform

The simplest deploy is to any platform that runs Node 20 + takes a start
command:

- **Heroku**: `git push heroku main` (add a `Procfile` with `web: npm start`).
- **Railway / Render / Fly.io**: point at the repo, set the start command
  to `npm start`, set the env vars.
- **Kubernetes**: see `docs/DEPLOYMENT.md` for manifest templates.
- **AWS ECS / Fargate**: build the Docker image, push to ECR, run as a service.

### 2.6. Post-deploy verification (5 minutes)

```bash
# 1. Health
curl https://api.example.com/health
# → {"status":"ok","uptime":12.3}

# 2. Readiness (proves the contract is wired up)
curl https://api.example.com/ready
# → {"status":"ready","contract":"0xNewAddress"}

# 3. Auth (should be 401 without the key)
curl -i https://api.example.com/getTransactions
# → HTTP/1.1 401 Unauthorized

# 4. Auth (should be 200 with the key)
curl -H "X-Api-Key: $X_API_KEY" https://api.example.com/getTransactions?userID=alice
# → [...]

# 5. Watch the logs
docker logs -f replay-tracking
# Look for: "Server listening on 3000"
# Look for: any "error" or "rate_limited" entries
```

### 2.7. Rollback (if anything goes wrong)

```bash
# Option 1: Roll the code back
git revert HEAD
git push origin main
# Wait for CI to pass
docker pull replay-tracking:v2.0.0  # the previous image
docker run -d --name replay-tracking -p 3000:3000 --env-file .env replay-tracking:v2.0.0

# Option 2: Pause the contract
# (no API endpoint — use cast or a wallet that owns the contract)
cast send 0xNewAddress "pause()" --rpc-url $RPC_URL --private-key $DEPLOYER_PRIVATE_KEY

# Option 3: Roll forward (fix the issue, redeploy)
# The new contract is a fresh address, so you can't "redeploy" it. Just fix
# the code, commit, and push.
```

---

## 3. What changed since v1

| Layer | v1 (2026-07-05 morning) | v2.1.0 (this release) |
|---|---|---|
| Solidity | 0.8.24, OZ v4 | 0.8.35, OZ v5.6.1 |
| Contract hardening | None | `ReentrancyGuard`, `whenNotPaused`, custom errors, `EnumerableSet` for `transactionKeys` |
| `nonces` mapping | Defined but unused | Actually increments, emitted in events |
| Constructor | `Ownable()` (deprecated) | `Ownable(initialOwner)` (OZ v5 requirement) |
| Storage | Unbounded `bytes32[]` (DoS risk) | `EnumerableSet.Bytes32Set` + 50-slot `__gap` |
| Tests | 11 | 32 (incl. fuzz + invariant) |
| Server | `xss-clean` (broken on Node 18+), no health, no request IDs | `sanitize-html`, /health, /ready, request IDs, structured logging |
| Auth | Plain `!==` API key compare | Constant-time compare + optional JWT |
| CORS | Always `*` | Pinned allowlist |
| CSP | None | Helmet `default-src 'none'` |
| Rate limit | Global 100/min | Global + per-route + allowlist |
| Body limit | None | 1 MiB |
| Schema validation | None | JSON Schema on every route |
| Auth in dev | Bypassed | Still bypassed (NODE_ENV check) |
| Auth in prod | `!==` | Constant-time + JWT optional |
| CI | None | GitHub Actions: install → audit → lint → format → compile → test → forge |
| Dependabot | None | Weekly |
| Linting | solhint only | solhint + ESLint flat config + Prettier + Solhint + commitlint |
| Pre-commit | None | husky + lint-staged |
| Docs | README only | README + Architecture + Security + Runbook + Deployment + Contributing + Changelog + 3 ADRs + OpenAPI + LICENSE |
| License | None | MIT |
| Foundry | 1.7.1 installed | 1.7.1 installed |
| Truffle / Ganache | Not installed | Not installed (still archived) |
| Ape / Brownie | Installed | Installed |

See [.upgrade/SUMMARY.md](../.upgrade/SUMMARY.md) (v1 → v2.0.0) and
[.upgrade/v2/SUMMARY.md](../.upgrade/v2/SUMMARY.md) (v2.0.0 → v2.1.0) for
the full diffs.

---

## 4. Operational runbook

### 4.1. Daily checks

```bash
# Are all RPCs healthy?
npm run health:rpc

# Is the server up?
curl https://api.example.com/health
```

### 4.2. When something goes wrong

See [RUNBOOK.md](RUNBOOK.md) for the full list of common incidents and how
to recover. Quick reference:

| Symptom | Likely cause | Fix |
|---|---|---|
| 503 `contract_not_configured` | `CONTRACT_ADDRESS` not set | Set it, restart |
| 401 in prod | Wrong `X-Api-Key` | Check `.env`, restart |
| 429 | Rate limit | Increase `RATE_LIMIT_MAX` or add to allowlist |
| 400 `BatchTooLarge(101,100)` | Caller sent 101 records | Caller must batch into ≤100 |
| Transaction reverted on chain | Admin tried to call while paused | `unpause()` first |
| Container won't start | Missing env var | `docker logs replay-tracking` |

### 4.3. Rotating secrets

```bash
# Rotate the API key
NEW_X_API_KEY=$(openssl rand -hex 32)
sed -i.bak "s/^X_API_KEY=.*/X_API_KEY=$NEW_X_API_KEY/" .env
docker restart replay-tracking

# Rotate the JWT secret (forces all clients to re-auth)
NEW_JWT_SECRET=$(openssl rand -hex 64)
sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" .env
docker restart replay-tracking
```

### 4.4. Upgrading the deployed contract

This contract is **not upgradeable**. To deploy a new version:

1. Deploy with `npm run deploy:prod` → new address.
2. Update `CONTRACT_ADDRESS` in `.env` → new address.
3. Restart the API.

There is no on-chain migration step. Off-chain consumers must be updated to
the new address.

If you need upgradeability in the future, the contract has a `uint256[50]
private __gap;` reserved for future state variables. To go upgradeable,
you'd need to:
1. Migrate the contract to `@openzeppelin/contracts-upgradeable`.
2. Wrap it in an `ERC1967Proxy`.
3. Add an `initialize(address initialOwner)` function (the constructor
   cannot be used in upgradeable contracts).

---

## 5. Security notes for prod

- **Use a multi-sig** for the deployer wallet. Single-key wallets are a
  single point of failure.
- **Use a managed RPC**. Public endpoints rate-limit aggressively and can
  go down without notice.
- **Subscribe to GitHub Dependabot**. We've already configured
  `.github/dependabot.yml` — make sure the GitHub repo has Dependabot alerts
  enabled (Settings → Code security and analysis).
- **Monitor the chain**. Set up alerts for:
  - `pause()` / `unpause()` events on the contract
  - Any tx sent by the deployer wallet that's NOT a `pause` / `unpause`
  - All admin functions being called from a new address
- **Back up `DEPLOYER_PRIVATE_KEY`** in a hardware wallet (Ledger, Trezor)
  or a password manager (1Password, Bitwarden). Never commit it to git.
- **Audit before any non-trivial change**. The 32-test suite is not an
  audit. For real money, hire Trail of Bits, OpenZeppelin, or similar.

---

## 6. Where to get help

| Question | Where |
|---|---|
| How does the code work? | [README.md](../README.md), [docs/ARCHITECTURE.md](ARCHITECTURE.md) |
| What changed? | [docs/CHANGELOG.md](CHANGELOG.md), [.upgrade/v2/SUMMARY.md](../.upgrade/v2/SUMMARY.md) |
| How do I deploy? | This document, [docs/DEPLOYMENT.md](DEPLOYMENT.md) |
| Something's broken | [docs/RUNBOOK.md](RUNBOOK.md) |
| Security issue | [SECURITY.md](../SECURITY.md) |
| How do I contribute? | [docs/CONTRIBUTING.md](CONTRIBUTING.md) |
| Why this tech choice? | [docs/ADR/](ADR/) |
