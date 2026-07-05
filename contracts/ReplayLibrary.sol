// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { EnumerableSet } from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title  ReplayLibrary
 * @notice Pure data + key-derivation helpers for the replay-tracking contract.
 *         Kept as a library so the storage layout is shared with the main contract
 *         via a single import.
 * @dev    v2 (2026-07-05):
 *           - `encodeKey` marked `pure` (already was) and documented with the
 *             exact preimage ordering.
 *           - Library no longer imports `Address` (was unused in v1).
 *           - `EnumerableSet` is imported in the main contract, not here, to
 *             keep this file framework-free.
 */
library ReplayLibrary {
    /**
     * @notice A single viewing record for one (user, day, asset) tuple.
     * @param  userId                  Opaque user identifier (string).
     * @param  day                     Day of month (1–31). NOT validated here —
     *                                 callers (admin scripts) are responsible.
     * @param  month                   Month of year (1–12). NOT validated here.
     * @param  year                    Calendar year. NOT validated here.
     * @param  totalDuration           Total seconds watched.
     * @param  totalRewardsConsumer    Tokens owed to the consumer, in wei.
     * @param  totalRewardsContentOwner Tokens owed to the content owner, in wei.
     * @param  assetId                 Opaque content identifier (string).
     */
    struct Transaction {
        string userId;
        uint256 day;
        uint256 month;
        uint256 year;
        uint256 totalDuration;
        uint256 totalRewardsConsumer;
        uint256 totalRewardsContentOwner;
        string assetId;
    }

    struct UserHistory {
        uint256 totalDuration;
        uint256 totalRewardsConsumer;
        uint256 totalRewardsContentOwner;
    }

    /**
     * @notice Computes the storage key for a (user, day, month, year, asset) tuple.
     * @dev    The preimage ordering is `(userId, day, month, year, assetId)`.
     *         Changing the ordering is a breaking change for any off-chain
     *         indexer that re-derives the key — do not reorder.
     * @param  userId  Opaque user identifier.
     * @param  day     Day of month.
     * @param  month   Month of year.
     * @param  year    Calendar year.
     * @param  assetId Opaque content identifier.
     * @return The 32-byte storage key.
     */
    function encodeKey(
        string memory userId,
        uint256 day,
        uint256 month,
        uint256 year,
        string memory assetId
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(userId, day, month, year, assetId));
    }
}
