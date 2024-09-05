// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts47/security/Pausable.sol";
import "@openzeppelin/contracts47/access/Ownable.sol";
import "@openzeppelin/contracts47/access/AccessControl.sol";
import "@openzeppelin/contracts47/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts47/utils/Address.sol";

import "./ReplayLibrary.sol";

contract ReplayTrackingContractV3 is Ownable, Pausable, AccessControl {
    using Address for address;

    using ReplayLibrary for ReplayLibrary.Transaction;

    // Define roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Nonce for replay attack prevention
    mapping(string => uint256) public nonces;

    // Mapping for storing daily transactions
    mapping(bytes32 => ReplayLibrary.Transaction[]) public dailyTransactions;

    // Event emitted when a transaction is added
    event TransactionAdded(
        string indexed userId,
        uint256 indexed day,
        uint256 indexed month,
        uint256 year,
        string assetId,
        uint256 totalDuration,
        uint256 totalRewardsConsumer,
        uint256 totalRewardsContentOwner
    );

    // Event emitted when a transaction is added
    event TransactionAdded(
        uint256 indexed day,
        uint256 indexed month,
        uint256 indexed year,
        ReplayLibrary.Transaction[] transactions
    );

    constructor() Ownable() Pausable() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "Only admin can call this function"
        );
        _;
    }

    // Function to pause the contract
    function pause() public onlyAdmin {
        _pause();
    }

    // Function to unpause the contract
    function unpause() public onlyAdmin {
        _unpause();
    }

    // Batch function to insert records for multiple users
    function batchInsertRecords(
        ReplayLibrary.Transaction[] calldata transactions
    ) external onlyAdmin whenNotPaused {
        require(transactions.length <= 100, "Batch size too large");

        for (uint256 i = 0; i < transactions.length; i++) {
            ReplayLibrary.Transaction memory newTxn = transactions[i];

            // Create a unique key for the transaction day
            bytes32 keyDay = ReplayLibrary.encodeKeyDayUser(
                newTxn.userId,
                newTxn.day,
                newTxn.month,
                newTxn.year
            );

            // Add the transaction to the dailyTransactions mapping
            dailyTransactions[keyDay].push(newTxn);
        }

        ReplayLibrary.Transaction memory txn = transactions[0];

        // Emit an event for the transaction added
        emit TransactionAdded(txn.day, txn.month, txn.year, transactions);
    }

    // Function to get transactions by a specific day
    function getTransactionsByDay(
        string memory userId,
        uint256 day,
        uint256 month,
        uint256 year
    ) public view returns (ReplayLibrary.Transaction[] memory) {
        bytes32 key = ReplayLibrary.encodeKeyDayUser(userId, day, month, year);
        return dailyTransactions[key];
    }
}
