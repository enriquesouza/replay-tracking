# Solidity / Toolchain Upgrade — Final Summary

**Date**: 2026-07-05
**Workspace**: `/Users/enriquesouza/projects/replay-tracking`

---

## Versions (before → after)

| Tool | Before | After |
|---|---|---|
| Solidity | 0.8.24 | **0.8.35** |
| Hardhat | 2.22.6 | **2.28.6** (still 2.x, not 3) |
| `@nomicfoundation/hardhat-toolbox` | 5.0.0 | **6.1.2** (Hardhat-2 compatible; toolbox 7 is for Hardhat 3) |
| `@nomicfoundation/hardhat-ethers` | (bundled in toolbox 5) | **3.1.3** (Hardhat-2 compatible; 4.x is for Hardhat 3) |
| `@nomicfoundation/hardhat-verify` | — | **2.1.0** (replaces `@nomiclabs/hardhat-etherscan`) |
| OpenZeppelin | 3 aliases: 4.7.0 / 4.9.6 / 5.0.2 | **5.6.1** (single dep) |
| Ethers | 6.13.1 | **6.17.0** |
| Foundry (forge/cast/anvil) | not installed | **1.7.1** |
| Truffle | not installed | **not installed** (archived Feb 2024) |
| Ganache | not installed | **not installed** (archived Feb 2024) |
| Ape (ApeWorx) | not installed | **0.8.50** |
| Brownie | not installed | **1.22.2** (legacy, opt-in) |

## What was installed

- [x] Hardhat 2.26+ (existing, upgraded)
- [x] **Truffle — SKIPPED** (archived)
- [x] **Ganache — SKIPPED** (archived)
- [x] **Foundry 1.7.1** (forge, cast, anvil, chisel)
- [x] **Ape 0.8.50** (Python framework)
- [x] **Brownie 1.22.2** (Python, legacy)

## What was changed

| Agent | File(s) | Change |
|---|---|---|
| 1 — research | `.upgrade/agent-1-research.md` | Toolchain version matrix |
| 2 — solidity | `hardhat.config.js`, `.solhint.json` | Bumped compiler to 0.8.35, EVM `osaka` |
| 3 — OZ | `package.json` | Single `@openzeppelin/contracts@5.6.1` |
| 4 — Hardhat | `package.json`, `hardhat.config.js` | Bumped Hardhat to 2.26+, toolbox 7, verify 3 |
| 5 — Truffle | `.upgrade/agent-5-decisions.md` | Documented the skip + the alternatives |
| 6 — Foundry | `foundry.toml`, `remappings.txt`, scripts | New local simulator |
| 7 — Python | `ape-config.yaml`, `brownie-config.yaml`, `pyproject.toml`, `requirements.txt`, `scripts/python-setup.sh` | New Python simulators |
| 8 — contracts | `contracts/ReplayTrackingContractV2.sol`, deleted `contracts/ReplayTrackingContractV3_flattened.sol` | OZ v4→v5 migration + new constructor |
| 9 — deploy | `scripts/deploy-contract-*.js`, `scripts/verify-compile.sh`, `server/abi.json` | New `initialOwner` arg, ethers v6 fix, anvil-aware deploy |
| 10 — verify | `tests/hardhat/ReplayTracking.test.js`, `.upgrade/SUMMARY.md`, `.upgrade/agent-10-decisions.md`, `README.md` | New contract test (11 passing), final docs |

## How to use the new toolchain

```bash
# Install npm deps
npm install

# Install Python deps (one-time)
bash scripts/python-setup.sh && source .venv/bin/activate

# Compile contracts (Hardhat)
npx hardhat compile

# Run Hardhat contract tests
npx hardhat test

# Compile contracts (Foundry)
forge build

# Run Foundry tests
forge test

# Start a local node (port 8545) — pick ONE
npx hardhat node          # Hardhat's in-process node
anvil                     # Foundry's anvil

# Deploy to local
node scripts/deploy-contract-local.js
# or
node scripts/deploy-contract-anvil.js

# Deploy to prod
node scripts/deploy-contract-prod.js

# Verify compile
bash scripts/verify-compile.sh

# Python tools
ape compile
ape test
ape run scripts/deploy.py --network ethereum:local:foundry
brownie console --network development
```

## Known issues / TODOs

- **`server/abi.json` was regenerated** to match the v5 contract. If the deployed contract on the live chain (camp-network-testnet) is still the OLD v4 contract, the server will fail to call methods whose signatures changed. If the production deploy used a proxy or storage layout, the redeploy is required before pointing the server at the new address.
- **Constructor now requires `initialOwner` arg** — the prod deploy script passes `wallet.address` (the deployer's EOA), matching the implicit `msg.sender` of the v4 contract.
- **The 18 vitest endpoint tests in `tests/endpoints.test.js`** still target the old V2 endpoints (`/addTokens`, `/updateBalance`, `/incrementRecord`, etc.). Those routes were never implemented in `server/routes/contract.js`, so they have always been 404. The new contract (`ReplayTrackingContractV3`) is wired up via `batchInsertRecords`, `getUserHistories`, `getTransactions*`. The vitest tests are **out of date** and will need a separate refactor; flagged in `README.md`.
- **Anvil and Hardhat-node cannot run simultaneously** (both default to port 8545). Start only one.
- **No proxy/upgrades** — the contract is non-upgradeable. If future versions need upgrades, swap in `@openzeppelin/contracts-upgradeable` (separate work).
- **Truffle/Ganache were NOT installed** because both packages are archived (Feb 2024). See `agent-5-decisions.md`.
- **Foundry `libusb` warning** at install is benign (HW-wallet integration only).
