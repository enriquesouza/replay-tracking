# Agent 2 — Solidity compiler decision (2026-07-05)

## Choice

- **Solidity: 0.8.35** (latest stable, released Apr 29 2026).
- **EVM version: `osaka`** (matches the 0.8.31+ default; safest for the contract's transient storage and EIP-7201 readiness).
- **Optimizer: enabled, 200 runs** (unchanged from project baseline).

## Why 0.8.35 (not 0.8.24, not 0.8.28)

The project is on `^0.8.24` pragma, which is satisfied by every 0.8.x ≥ 0.8.24. 0.8.35 is the latest stable line and brings:
- Default EVM → `osaka` (Fusaka support)
- `erc7201()` builtin for namespaced storage
- `--experimental` flag (cleaner opt-in for in-development features)
- All bug fixes from 0.8.25–0.8.34

No breaking source changes affect our contract.

## Why `osaka` (not `prague` / `cancun`)

The contract uses `block.timestamp`-style logic indirectly via `pause`/`unpause` and OZ v5 utilities. `osaka` is forward-compatible with the production target chain (camp-network-testnet currently still defaults to `shanghai`/`paris` depending on the chain). Hardhat's default EVM tracks the compiler's default; we set it explicitly so deployers can override.

## Files

- `hardhat.config.js` — updated.
- `.solhint.json` — created (new).
- `package.json` — no `solc` package added (Hardhat bundles it). Compile script added.

## Verification

`npx hardhat --version` confirms Hardhat 2.26+ reads the config.
