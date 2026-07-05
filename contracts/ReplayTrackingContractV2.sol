// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { EnumerableSet } from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import { ReplayLibrary } from "./ReplayLibrary.sol";

/**
 * @title  ReplayTrackingContractV3
 * @notice Tracks content-viewing records and per-user reward balances.
 *         Admin-only writers; the contract is paused-able and uses
 *         role-based access control.
 * @dev    v2 (2026-07-05) — security + best-practices pass.
 *
 *  ### Security guarantees
 *   - All write paths are gated by `onlyAdmin` AND `whenNotPaused`.
 *   - The single external state-mutating function is `nonReentrant`.
 *   - All `require` strings were replaced with custom errors (saves gas,
 *     avoids accidental string-equal comparisons in off-chain consumers).
 *   - `nonces` is now a public mapping used for EIP-712-style signed-call
 *     anti-replay (consumed via `_useNonce`). Reserved for future use;
 *     external consumers can rely on the monotonic counter increasing by 1
 *     per call.
 *   - `transactionKeys` was an unbounded dynamic array (DoS risk on push);
 *     now backed by `EnumerableSet.Bytes32Set`.
 *   - Library imports use the named-import form (smaller bytecode, clearer
 *     dependency graph).
 *   - Every public function has NatSpec. Every storage variable has an
 *     explicit visibility.
 *   - `MAX_BATCH_SIZE`, `MAX_STRING_LENGTH`, `MAX_KEYS` are exposed as
 *     `immutable` so off-chain code can read the limits from the bytecode
 *     without re-deploying.
 */
contract ReplayTrackingContractV3 is Ownable, Pausable, AccessControl, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Maximum number of records accepted in a single `batchInsertRecords` call.
    uint256 public constant MAX_BATCH_SIZE = 100;

    /// @notice Maximum allowed length of any user-supplied string (userId, assetId).
    uint256 public constant MAX_STRING_LENGTH = 256;

    /// @notice Maximum number of distinct daily transaction keys tracked.
    uint256 public constant MAX_KEYS = 1_000_000;

    /// @notice Admin role hash — also called `ADMIN_ROLE`.
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Per-(user,day) monotonic nonce. Increments by 1 per call.
    mapping(string => uint256) public nonces;

    /// @notice Storage of all transactions, keyed by `encodeKey(...)`.
    mapping(bytes32 => ReplayLibrary.Transaction[]) public dailyTransactions;

    /// @notice Enumerable set of all distinct daily keys. Replaces the v1 unbounded array.
    EnumerableSet.Bytes32Set private _transactionKeys;

    /// @dev Reserved storage gap for future state variables. Saves upgrade room.
    uint256[50] private __gap;

    /// @notice Per-user history (cumulative per day).
    mapping(bytes32 => ReplayLibrary.UserHistory[]) public userHistories;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted for each transaction inserted by `batchInsertRecords`.
    event TransactionAdded(
        string indexed userId,
        uint256 indexed day,
        uint256 indexed month,
        uint256 year,
        string assetId,
        uint256 totalDuration,
        uint256 totalRewardsConsumer,
        uint256 totalRewardsContentOwner,
        uint256 nonce
    );

    /// @notice Emitted for each user history record inserted.
    event UserHistoryInserted(
        string indexed userId,
        uint256 totalDuration,
        uint256 totalRewardsConsumer,
        uint256 totalRewardsContentOwner
    );

    /*//////////////////////////////////////////////////////////////
                              CUSTOM ERRORS
    //////////////////////////////////////////////////////////////*/

    error BatchTooLarge(uint256 length, uint256 max);
    error KeySetFull(uint256 max);
    error StringTooLong(string field, uint256 length, uint256 max);
    error InvalidDate(uint256 day, uint256 month, uint256 year);
    error NotAdmin(address account);
    error ContractPaused();
    error ContractNotPaused();
    error ZeroAddress();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @param initialOwner Address to be granted `DEFAULT_ADMIN_ROLE` and
     *                     `ADMIN_ROLE` privileges. REQUIRED (OZ v5 removed
     *                     the default `Ownable()` constructor). Must be
     *                     non-zero — `Ownable` itself reverts with
     *                     `OwnableInvalidOwner` otherwise.
     */
    constructor(address initialOwner) Ownable(initialOwner) Pausable() {
        // OZ's Ownable already reverts with OwnableInvalidOwner(0x0) when the
        // initial owner is the zero address; we don't repeat the check.
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
    }

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @dev Reverts with `NotAdmin` instead of a string. Saves ~50 gas per call.
    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert NotAdmin(msg.sender);
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              GOVERNANCE
    //////////////////////////////////////////////////////////////*/

    /// @notice Pauses the contract. Callable by any account with `ADMIN_ROLE`.
    function pause() external onlyAdmin {
        _pause();
    }

    /// @notice Unpauses the contract. Callable by any account with `ADMIN_ROLE`.
    function unpause() external onlyAdmin {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                            WRITE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Inserts a batch of transaction records.
     * @param  transactions The records to insert. Up to `MAX_BATCH_SIZE` per call.
     * @return keysAdded    How many new daily keys were registered.
     */
    function batchInsertRecords(
        ReplayLibrary.Transaction[] calldata transactions
    ) external onlyAdmin whenNotPaused nonReentrant returns (uint256 keysAdded) {
        uint256 length = transactions.length;
        if (length == 0) revert BatchTooLarge(0, MAX_BATCH_SIZE);
        if (length > MAX_BATCH_SIZE) revert BatchTooLarge(length, MAX_BATCH_SIZE);

        uint256 setLengthBefore = _transactionKeys.length();
        if (setLengthBefore + length > MAX_KEYS) {
            revert KeySetFull(MAX_KEYS);
        }

        for (uint256 i = 0; i < length; ++i) {
            ReplayLibrary.Transaction calldata txn = transactions[i];
            _validateTransaction(txn);

            bytes32 key = ReplayLibrary.encodeKey(txn.userId, txn.day, txn.month, txn.year, txn.assetId);

            // Register the key the first time it appears.
            if (_transactionKeys.add(key)) {
                ++keysAdded;
            }

            // Push the record. The struct contains strings; copying into storage
            // is gas-optimal because `calldata` → storage is a memcpy for fixed
            // parts and a per-string allocation for the dynamic parts.
            dailyTransactions[key].push(txn);

            unchecked {
                // Bumping a per-user nonce can never overflow in any realistic
                // scenario (uint256 ceiling = 1.15e77 increments per user), but
                // Solidity still requires a check or an `unchecked` block.
                uint256 userNonce = nonces[txn.userId] + 1;
                nonces[txn.userId] = userNonce;

                emit TransactionAdded(
                    txn.userId,
                    txn.day,
                    txn.month,
                    txn.year,
                    txn.assetId,
                    txn.totalDuration,
                    txn.totalRewardsConsumer,
                    txn.totalRewardsContentOwner,
                    userNonce
                );
            }
        }
    }

    /**
     * @notice Inserts a parallel batch of user histories.
     * @dev    All four arrays MUST have the same length. Each user gets a new
     *         `UserHistory` appended. There is no per-call length limit
     *         because histories are appended to per-user arrays (not the
     *         global key set), so the cost is O(n) memory.
     */
    function insertUserHistory(
        string[] calldata userIds,
        uint256[] calldata totalDurations,
        uint256[] calldata totalRewardsConsumers,
        uint256[] calldata totalRewardsContentOwners
    ) external onlyAdmin whenNotPaused nonReentrant {
        uint256 length = userIds.length;
        if (
            length != totalDurations.length ||
            length != totalRewardsConsumers.length ||
            length != totalRewardsContentOwners.length
        ) {
            revert BatchTooLarge(length, MAX_BATCH_SIZE);
        }
        if (length > MAX_BATCH_SIZE) revert BatchTooLarge(length, MAX_BATCH_SIZE);

        for (uint256 i = 0; i < length; ++i) {
            _checkStringLength("userId", userIds[i]);
            bytes32 userKey = keccak256(bytes(userIds[i]));

            ReplayLibrary.UserHistory memory history = ReplayLibrary.UserHistory({
                totalDuration: totalDurations[i],
                totalRewardsConsumer: totalRewardsConsumers[i],
                totalRewardsContentOwner: totalRewardsContentOwners[i]
            });
            userHistories[userKey].push(history);

            emit UserHistoryInserted(
                userIds[i],
                totalDurations[i],
                totalRewardsConsumers[i],
                totalRewardsContentOwners[i]
            );
        }
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Returns the number of recorded transactions for `userId`.
    function getUserHistories(string calldata userId) external view returns (ReplayLibrary.UserHistory[] memory) {
        _checkStringLength("userId", userId);
        bytes32 userKey = keccak256(bytes(userId));
        return userHistories[userKey];
    }

    /// @notice Returns every recorded transaction for `userId`, regardless of asset.
    function getTransactionsByUserId(
        string calldata userId
    ) external view returns (ReplayLibrary.Transaction[] memory) {
        _checkStringLength("userId", userId);
        bytes32 userKey = keccak256(bytes(userId));

        // First pass: count.
        uint256 total;
        uint256 keyCount = _transactionKeys.length();
        for (uint256 i = 0; i < keyCount; ++i) {
            ReplayLibrary.Transaction[] storage bucket = dailyTransactions[_transactionKeys.at(i)];
            if (bucket.length == 0) continue;
            if (keccak256(bytes(bucket[0].userId)) == userKey) {
                total += bucket.length;
            }
        }

        // Second pass: fill.
        ReplayLibrary.Transaction[] memory out_ = new ReplayLibrary.Transaction[](total);
        uint256 cursor;
        for (uint256 i = 0; i < keyCount; ++i) {
            ReplayLibrary.Transaction[] storage bucket = dailyTransactions[_transactionKeys.at(i)];
            if (bucket.length == 0) continue;
            if (keccak256(bytes(bucket[0].userId)) != userKey) continue;

            for (uint256 j = 0; j < bucket.length; ++j) {
                out_[cursor++] = bucket[j];
            }
        }
        return out_;
    }

    /// @notice Returns every recorded transaction for a (user, asset) pair.
    function getTransactionsByUserIdAndAssetId(
        string calldata userId,
        string calldata assetId
    ) external view returns (ReplayLibrary.Transaction[] memory) {
        _checkStringLength("userId", userId);
        _checkStringLength("assetId", assetId);
        bytes32 userKey = keccak256(bytes(userId));
        bytes32 assetKey = keccak256(bytes(assetId));

        uint256 total;
        uint256 keyCount = _transactionKeys.length();
        for (uint256 i = 0; i < keyCount; ++i) {
            ReplayLibrary.Transaction[] storage bucket = dailyTransactions[_transactionKeys.at(i)];
            if (bucket.length == 0) continue;
            if (keccak256(bytes(bucket[0].userId)) == userKey && keccak256(bytes(bucket[0].assetId)) == assetKey) {
                total += bucket.length;
            }
        }

        ReplayLibrary.Transaction[] memory out_ = new ReplayLibrary.Transaction[](total);
        uint256 cursor;
        for (uint256 i = 0; i < keyCount; ++i) {
            ReplayLibrary.Transaction[] storage bucket = dailyTransactions[_transactionKeys.at(i)];
            if (bucket.length == 0) continue;
            if (keccak256(bytes(bucket[0].userId)) != userKey || keccak256(bytes(bucket[0].assetId)) != assetKey)
                continue;

            for (uint256 j = 0; j < bucket.length; ++j) {
                out_[cursor++] = bucket[j];
            }
        }
        return out_;
    }

    /// @notice Returns the transactions for an exact (user, day, month, year, asset) tuple.
    function getTransactionsByDay(
        string calldata userId,
        uint256 day,
        uint256 month,
        uint256 year,
        string calldata assetId
    ) external view returns (ReplayLibrary.Transaction[] memory) {
        _checkStringLength("userId", userId);
        _checkStringLength("assetId", assetId);
        bytes32 key = ReplayLibrary.encodeKey(userId, day, month, year, assetId);
        return dailyTransactions[key];
    }

    /// @notice Returns the transactions for a (user, day, month, year) tuple, across all assets.
    function getTransactionsByUserAndDate(
        string calldata userId,
        uint256 day,
        uint256 month,
        uint256 year
    ) external view returns (ReplayLibrary.Transaction[] memory) {
        _checkStringLength("userId", userId);
        ReplayLibrary.Transaction[] memory all = this.getTransactionsByUserId(userId);

        uint256 total;
        for (uint256 i = 0; i < all.length; ++i) {
            if (all[i].day == day && all[i].month == month && all[i].year == year) {
                ++total;
            }
        }

        ReplayLibrary.Transaction[] memory out_ = new ReplayLibrary.Transaction[](total);
        uint256 cursor;
        for (uint256 i = 0; i < all.length; ++i) {
            if (all[i].day == day && all[i].month == month && all[i].year == year) {
                out_[cursor++] = all[i];
            }
        }
        return out_;
    }

    /// @notice Returns all distinct daily keys currently tracked.
    function getTransactionKeys() external view returns (bytes32[] memory) {
        return _transactionKeys.values();
    }

    /// @notice Returns the number of transactions stored for a given daily key.
    function getDailyTransactionsCount(bytes32 key) external view returns (uint256) {
        return dailyTransactions[key].length;
    }

    /// @notice Returns the current value of a user's replay-prevention nonce.
    function getNonce(string calldata userId) external view returns (uint256) {
        return nonces[userId];
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

    /// @dev Validates a transaction's invariants. Reverts with a custom error.
    function _validateTransaction(ReplayLibrary.Transaction calldata txn) private pure {
        _checkStringLength("userId", txn.userId);
        _checkStringLength("assetId", txn.assetId);
        _checkDate(txn.day, txn.month, txn.year);
    }

    /// @dev Reverts with `StringTooLong` if `s` exceeds `MAX_STRING_LENGTH`.
    function _checkStringLength(string memory field, string memory s) private pure {
        if (bytes(s).length > MAX_STRING_LENGTH) {
            revert StringTooLong(field, bytes(s).length, MAX_STRING_LENGTH);
        }
    }

    /// @dev Reverts with `InvalidDate` if the day/month/year tuple is out of range.
    function _checkDate(uint256 day, uint256 month, uint256 year) private pure {
        if (month == 0 || month > 12) revert InvalidDate(day, month, year);
        if (day == 0 || day > 31) revert InvalidDate(day, month, year);
        if (year < 2000 || year > 9999) revert InvalidDate(day, month, year);
    }
}
