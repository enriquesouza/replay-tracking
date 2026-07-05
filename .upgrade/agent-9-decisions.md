# Agent 9 — Deploy scripts & server routes decision (2026-07-05)

## Files modified

1. `scripts/deploy-contract-local.js` — pass `initialOwner` to constructor; remove redundant `wallet.address` workarounds.
2. `scripts/deploy-contract-prod.js` — same.
3. `scripts/deploy-contract-anvil.js` — **NEW**. Explicit local-node deploy with a CLI flag for hardhat-node vs anvil.
4. `scripts/verify-compile.sh` — **NEW**. `npx hardhat compile` with success/failure marker.
5. `scripts/python-setup.sh` — **NEW** (Agent 7).
6. `server/abi.json` — **REGENERATED** from the new artifact.

## Constructor change

The contract now requires `address initialOwner` as the constructor arg. Both deploy scripts pass `wallet.address` (the EOA that broadcasts the tx, which is the v4 equivalent of `Ownable`'s implicit `msg.sender` initialization).

```js
// before:
const contract = await factory.deploy(...constructorArgs);

// after:
const contract = await factory.deploy(wallet.address, ...constructorArgs);
```

## Ethers v6 migration points in the scripts

These were checked against the existing code:

- `ethers.utils.formatEther` → `ethers.formatEther` (global, no `.utils`). The existing prod script has this typo; fixed.
- `provider.getFeeData().gasPrice` → still works in Ethers v6.
- `contract.target` → still works in Ethers v6 (replaces the v5 `.address`).
- `await contract.getAddress()` → still works in v6.

No other v5→v6 deltas affected the scripts (the project was already on Ethers 6.13.1).

## New anvil-aware deploy

`scripts/deploy-contract-anvil.js` defaults to `http://127.0.0.1:8545` and accepts an env var `LOCAL_RPC` to override. It uses the well-known anvil default account #0 (private key `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` — a public dev key documented in Foundry's book). The user can override with `DEPLOYER_PRIVATE_KEY`.

## `verify-compile.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npx hardhat compile
echo "✅ hardhat compile OK"
```

## Verification

`node -c scripts/deploy-contract-local.js` → no syntax error.
`node -c scripts/deploy-contract-prod.js` → no syntax error.
`node -c scripts/deploy-contract-anvil.js` → no syntax error.
