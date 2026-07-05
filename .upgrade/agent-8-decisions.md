# Agent 8 — Solidity source migration decision (2026-07-05)

## Files modified

1. `contracts/ReplayTrackingContractV2.sol` — full OZ v4→v5 migration (see below).
2. `contracts/ReplayLibrary.sol` — bumped pragma comment; no functional change.
3. `contracts/ReplayTrackingContractV3_flattened.sol` — **DELETED** (regenerated on every `npx hardhat compile`; the committed v4.7 flatten is now invalid).

## Source changes (ReplayTrackingContractV2.sol)

### Imports

```solidity
// BEFORE (v4 paths):
import "@openzeppelin/contracts47/security/Pausable.sol";
import "@openzeppelin/contracts47/access/Ownable.sol";
import "@openzeppelin/contracts47/access/AccessControl.sol";
import "@openzeppelin/contracts47/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts47/utils/Address.sol";

// AFTER (v5 paths):
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
```

### Constructor

```solidity
// BEFORE:
constructor() Ownable() Pausable() {
  _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  _grantRole(ADMIN_ROLE, msg.sender);
}

// AFTER (v5 requires initialOwner):
constructor(address initialOwner) Ownable(initialOwner) Pausable() {
  _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  _grantRole(ADMIN_ROLE, msg.sender);
}
```

### Pragma

`pragma solidity ^0.8.24;` — unchanged, still satisfied by 0.8.35.

### ReplayLibrary.sol

`pragma solidity ^0.8.24;` — unchanged.

## Hardhat compile result

`npx hardhat compile` → all three contracts (V2 = V3, ReplayLibrary) compile with **0 warnings, 0 errors** under Solidity 0.8.35 + OZ v5.6.1.

## ABI regeneration

`server/abi.json` was committed from the OLD v4.7 contract. After recompile, the artifact at `artifacts/contracts/ReplayTrackingContractV2.sol/ReplayTrackingContractV3.json` is the new ABI. Agent 9 re-copies it to `server/abi.json`.

## Constructor arg note — pass to Agent 9

The constructor now **requires** an `address initialOwner` argument. All `deploy-contract-*.js` scripts must pass one. The deploy script should use the `wallet.address` of the deployer (matches what `Ownable` is initialized to in the v4 contract by `msg.sender`).
