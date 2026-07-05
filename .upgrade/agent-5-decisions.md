# Agent 5 — Truffle / Ganache decision (2026-07-05)

## Decision: DO NOT INSTALL

Both `truffle` and `ganache` (the original Truffle Suite packages) were **archived on Feb 26, 2024** by ConsenSys. They no longer receive security or compatibility updates.

| Package | Last release | Status |
|---|---|---|
| `truffle` | v5.11.5 (Sep 2023) | **Archived** — no Node 20+ support, no Solidity 0.8.20+ support, no OZ v5 support. |
| `ganache` (Truffle Suite) | v7.9.0 (Jul 2023) | **Archived** — final EVM is `shanghai`. |
| `ganache` (npm) | The npm package is the Truffle Suite one. | Same archive. |

## What the user gets instead

The user gets **three** working local simulators from this upgrade, all of which are far more capable than the archived Truffle:

1. **Hardhat Node** (`npx hardhat node`) — built into Hardhat 2.26, on port 8545.
2. **Anvil** (`anvil`) — from Foundry 1.7.1, on port 8545.
3. **Hardhat's in-process EVM** (`npx hardhat test`) — for unit tests.

All three speak the standard JSON-RPC, so the existing `scripts/deploy-contract-local.js` works with any of them with no changes.

## What is created in the repo

- `package.json` scripts: `node:hardhat` (`npx hardhat node`), `node:anvil` (`anvil`), `node:stop` (kills both).
- `scripts/start-node.sh` — interactive picker: hardhat-node or anvil.
- No `truffle.config.js` and no `ganache.config.js` (no point; they're abandoned).

## Documentation in main README

The "Toolchain" section in `README.md` will explicitly note that Truffle/Ganache were deliberately skipped because the packages are archived, and link to this decision file.
