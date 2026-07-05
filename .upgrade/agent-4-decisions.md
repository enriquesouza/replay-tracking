# Agent 4 — Hardhat upgrade decision (2026-07-05)

## Choice

- **`hardhat@^2.28.6`** (latest 2.x, NOT 3.x).
- **`@nomicfoundation/hardhat-toolbox@^6.1.2`** (the Hardhat-2-compatible toolbox; toolbox 7 requires Hardhat 3).
- **`@nomicfoundation/hardhat-ethers@^3.1.3`** (Ethers v6 plugin, 3.x line is the Hardhat-2-compatible one; 4.x is for Hardhat 3).
- **`@nomicfoundation/hardhat-verify@^2.1.0`** (replaces deprecated `@nomiclabs/hardhat-etherscan`).
- **`@nomicfoundation/hardhat-ignition-ethers@^0.15.14`** + **`@nomicfoundation/hardhat-network-helpers@^1.1.0`** + **`@nomicfoundation/hardhat-chai-matchers@^2.1.0`** (pulled in by toolbox 6.x).
- **`hardhat-gas-reporter@^2.3.0`**, **`solidity-coverage@^0.8.17`**, **`solhint@^5.1.0`** (optional).
- **Removed**: `@nomiclabs/hardhat-etherscan` (deprecated; superseded by `hardhat-verify`).
- **Removed**: three `@openzeppelin/contracts{4,47,5}` aliases (see Agent 3).

## Why Hardhat 2 (not 3)

Hardhat 3 ships Viem as the primary provider and removes several Ethers-only APIs the project relies on. The 2.x line (current 2.28.6) is still maintained for Ethers v6 users. Sticking with 2.x keeps the migration surgical.

## Version matrix (Hardhat 2.x-compatible)

| Package | Version | Why |
|---|---|---|
| `hardhat` | 2.28.6 | Latest 2.x. |
| `@nomicfoundation/hardhat-toolbox` | 6.1.2 | Latest toolbox that supports Hardhat 2. |
| `@nomicfoundation/hardhat-ethers` | 3.1.3 | v3 line is the Hardhat-2 compatible line (v4 requires Hardhat 3). |
| `@nomicfoundation/hardhat-verify` | 2.1.0 | For Etherscan / Blockscout verification. |
| `@nomicfoundation/hardhat-chai-matchers` | 2.1.0 | For `.to.be.revertedWith`, `.to.emit`, etc. |
| `@nomicfoundation/hardhat-network-helpers` | 1.1.0 | For `loadFixture`. |
| `@nomicfoundation/hardhat-ignition-ethers` | 0.15.14 | For the Ignition deploy module. |

## Final `devDependencies` block

```json
{
  "devDependencies": {
    "@nomicfoundation/hardhat-chai-matchers": "^2.1.0",
    "@nomicfoundation/hardhat-ethers": "^3.1.3",
    "@nomicfoundation/hardhat-ignition-ethers": "^0.15.14",
    "@nomicfoundation/hardhat-network-helpers": "^1.1.0",
    "@nomicfoundation/hardhat-toolbox": "^6.1.2",
    "@nomicfoundation/hardhat-verify": "^2.1.0",
    "@typechain/ethers-v6": "^0.5.0",
    "@typechain/hardhat": "^9.0.0",
    "@types/chai": "^4.2.0",
    "@types/mocha": "^9.1.0",
    "@types/node": "^20.0.0",
    "chai": "^4.2.0",
    "hardhat": "^2.28.6",
    "hardhat-gas-reporter": "^2.3.0",
    "nodemon": "^3.1.4",
    "solidity-coverage": "^0.8.17",
    "solhint": "^5.1.0",
    "supertest": "^7.0.0",
    "ts-node": ">=8.0.0",
    "typechain": "^8.3.0",
    "typescript": ">=4.5.0",
    "vitest": "^2.0.4"
  }
}
```

## `hardhat.config.js` changes

- Loads `@nomicfoundation/hardhat-toolbox`.
- Replaced the commented-out `@nomiclabs/hardhat-etherscan` block with an equivalent `@nomicfoundation/hardhat-verify` config for the camp-network-testnet.
- Set `paths.sources = "./contracts"`, `paths.tests = "./tests/hardhat"`.
- Solidity version updated to `0.8.35` (Agent 2).

## Verification

- `npx hardhat --version` → 2.28.6.
- `npx hardhat compile` → "Compiled 15 Solidity files successfully (evm target: osaka)".
- `npx hardhat test` → **11 passing, 0 failing** (against the v5 OZ contract).

## Install issues

None observed after fixing the initial version mismatch (the first install attempt used `hardhat-ethers@4.x` which is Hardhat-3-only).
