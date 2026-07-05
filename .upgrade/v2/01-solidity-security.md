# Domain 1 — Solidity contract security hardening (10 tasks)

## Tasks 1–10 (in execution order)

### Task 1: Reentrancy guard on `batchInsertRecords`

- Added `ReentrancyGuard` to the inheritance list.
- Added the `nonReentrant` modifier to `batchInsertRecords` and `insertUserHistory`.
- No external calls in those functions today, but the guard is mandatory for any future code path.

### Task 2: Pause guard on all writes

- All write functions now have `whenNotPaused` in addition to `onlyAdmin`.

### Task 3: `transactionKeys` → `EnumerableSet.Bytes32Set`

- Replaced the unbounded `bytes32[] public transactionKeys` with `EnumerableSet.Bytes32Set private _transactionKeys`.
- `_transactionKeys.add(key)` is `O(1)` and prevents duplicate pushes.
- A public `getTransactionKeys()` view exposes the values.
- Added `MAX_KEYS = 1_000_000` to bound the set and revert with `KeySetFull` if exceeded.

### Task 4: Custom errors instead of `require` strings

- `require(condition, "string")` → `if (!condition) revert CustomError(...)`.
- Saves ~50 gas per revert.
- Off-chain decoders get structured error data instead of opaque strings.

### Task 5: `nonces` mapping actually increments

- v1 defined `mapping(string => uint256) public nonces` but never used it.
- v2 increments `nonces[txn.userId]` on every `batchInsertRecords` call (inside `unchecked`).
- Emitted in the `TransactionAdded` event so off-chain indexers can verify ordering.
- Added a public `getNonce(userId)` view.

### Task 6: `__gap` storage reserved

- Added `uint256[50] private __gap;` to the storage layout.
- This leaves room for 50 future state variables without changing the storage layout hash (if we later wrap this contract in an upgradeable proxy).

### Task 7: `MAX_BATCH_SIZE`, `MAX_STRING_LENGTH`, `MAX_KEYS` as `immutable`

- Constants are now `immutable` (read-once at deploy), so off-chain can read them from the bytecode.
- `_validateTransaction` enforces `MAX_STRING_LENGTH` and date bounds.

### Task 8: NatSpec on every public function

- All 9 public functions have `@notice`, `@param`, `@return` (where applicable).

### Task 9: Date validation

- `_checkDate(day, month, year)` reverts with `InvalidDate(day, month, year)` if any of the three is out of range.
- Day: 1–31. Month: 1–12. Year: 2000–9999.

### Task 10: ZeroAddress check on `initialOwner`

- OZ v5's `Ownable` already reverts with `OwnableInvalidOwner(0x0)` if the initial owner is zero.
- Test added to confirm.

## Verification

- 32 contract tests passing, including 6 new ones for these changes:
  - `reverts with OwnableInvalidOwner if initialOwner is 0x0`
  - `reverts NotAdmin when a non-admin calls batchInsertRecords` (with `.withArgs(alice.address)`)
  - `reverts StringTooLong when userId exceeds MAX_STRING_LENGTH`
  - `reverts InvalidDate when month is 0 or 13`
  - `reverts InvalidDate when day is 0 or 32`
  - `reverts InvalidDate when year is out of range`
  - `increments per-user nonce by 1 per batchInsertRecords call`
