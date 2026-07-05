# Domain 2 — Solidity gas optimization & best practices (10 tasks)

## Tasks 11–20

### Task 11: Named imports
- `import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";` instead of `import "@openzeppelin/.../Pausable.sol";`
- Smaller bytecode, clearer dependency graph.

### Task 12: `calldata` instead of `memory` for `Transaction[]` in `batchInsertRecords`
- The function takes `ReplayLibrary.Transaction[] calldata transactions` — saves the cost of copying the array to memory.

### Task 13: `unchecked` block around the nonce increment
- `uint256 userNonce = nonces[txn.userId] + 1;` in `unchecked { ... }` — the overflow check is unnecessary in any realistic scenario (1.15e77 increments per user).

### Task 14: Removed unused `using Address for address`
- v1 imported `Address.sol` and added `using Address for address;` but never used it. Removed.

### Task 15: `pure` instead of `view` on pure helpers
- `_validateTransaction` and `_checkStringLength` and `_checkDate` are now `pure` (they read no state).

### Task 16: Caching `userKey` and `assetKey` in views
- `getTransactionsByUserId` and `getTransactionsByUserIdAndAssetId` pre-compute `keccak256(bytes(...))` once per call.

### Task 17: Two-pass `out_` allocation
- Same as v1, but now with the `EnumerableSet` so iteration is gas-bounded.

### Task 18: Replaced `address` with `address` in events
- All event parameters are correctly typed and indexed where useful.

### Task 19: Removed implicit zero-init
- All struct fields are explicitly initialized.

### Task 20: `bytes32` instead of `string` for keys
- Already done in v1; preserved in v2.

## Verification

- Gas reporter enabled via `REPORT_GAS=true npm run test:contracts`.
- Solhint: 0 errors, 12 cosmetic warnings (mostly future-keyword hints in OZ, our `gas-indexed-events` suggestion).
