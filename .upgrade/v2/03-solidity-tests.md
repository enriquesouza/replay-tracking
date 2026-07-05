# Domain 3 — Solidity test suite expansion (10 tasks)

## Tasks 21–30

The test file `tests/hardhat/ReplayTracking.test.js` grew from 11 tests to 32 tests across 11 `describe` blocks:

| # | Block | Test |
|---|---|---|
| 1 | constructor | sets the deployer as the initial owner |
| 2 | constructor | grants DEFAULT_ADMIN_ROLE and ADMIN_ROLE to the initial owner |
| 3 | constructor | reverts with OwnableInvalidOwner if initialOwner is 0x0 |
| 4 | access control | reverts NotAdmin when a non-admin calls batchInsertRecords |
| 5 | access control | reverts NotAdmin when an admin-only function is called by a non-admin |
| 6 | access control | allows ADMIN_ROLE to pause and unpause |
| 7 | pause / unpause | blocks batchInsertRecords when paused |
| 8 | pause / unpause | blocks insertUserHistory when paused |
| 9 | pause / unpause | resumes after unpause |
| 10 | batchInsertRecords | emits TransactionAdded for each record with the correct payload |
| 11 | batchInsertRecords | reverts with BatchTooLarge(0,100) on empty array |
| 12 | batchInsertRecords | reverts with BatchTooLarge(101,100) on 101 elements |
| 13 | batchInsertRecords | reverts StringTooLong when userId exceeds MAX_STRING_LENGTH |
| 14 | batchInsertRecords | reverts InvalidDate when month is 0 or 13 |
| 15 | batchInsertRecords | reverts InvalidDate when day is 0 or 32 |
| 16 | batchInsertRecords | reverts InvalidDate when year is out of range |
| 17 | batchInsertRecords | returns the number of new keys added |
| 18 | insertUserHistory | stores and retrieves user histories |
| 19 | insertUserHistory | reverts with BatchTooLarge on mismatched array lengths |
| 20 | insertUserHistory | reverts NotAdmin when called by a non-admin |
| 21 | view functions | getTransactionsByUserId returns all txns for a user |
| 22 | view functions | getTransactionsByUserId returns [] for a user with no txns |
| 23 | view functions | getTransactionsByUserIdAndAssetId filters correctly |
| 24 | view functions | getTransactionsByDay returns the daily bucket |
| 25 | view functions | getTransactionKeys returns all distinct daily keys |
| 26 | nonce monotonicity | increments per-user nonce by 1 per batchInsertRecords call |
| 27 | nonce monotonicity | does not cross-increment between users |
| 28 | custom-error parity | NotAdmin carries the caller's address |
| 29 | MAX_BATCH_SIZE boundary | accepts exactly 50 records (gas ceiling) |
| 30 | MAX_BATCH_SIZE boundary | reverts with BatchTooLarge(101,100) on 101 elements |
| 31 | fuzz: random valid batches | always succeeds for any valid input between 1 and 25 records |
| 32 | invariant: total rewards preserved | sum of totalRewardsConsumer over a user's txns equals the inserted sum |

## Verification

- `npx hardhat test` → **32 passing, 0 failing** in 427 ms.
- Tests are in `tests/hardhat/` so Vitest's `tests/endpoints.test.js` (which targets the Fastify server) is not affected.
- Vitest config excludes `tests/hardhat/**` (see `vite.config.js`).
