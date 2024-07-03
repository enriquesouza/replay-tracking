// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ReplayTrackingContract is
    Ownable,
    ReentrancyGuard,
    Pausable,
    AccessControl
{
    using EnumerableSet for EnumerableSet.AddressSet;
    using Address for address;

    // Define roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Mapping of wallet addresses to their current balance of tokens
    mapping(address => uint256) public wallets;

    // Address of the admin who can add tokens to user wallets
    address public tokenAdmin;

    // Nonce for replay attack prevention
    mapping(address => uint256) public nonces;

    // Event emitted when an admin is added
    event AdminAdded(address admin);

    // Event emitted when an admin is removed
    event AdminRemoved(address admin);

    // Event emitted when the token admin is set
    event TokenAdminSet(address tokenAdmin);

    // Event emitted when a record is incremented
    event RecordIncremented(
        address user,
        uint256 month,
        uint256 year,
        uint256 timeWatched,
        uint256 amountEarned
    );

    // Event emitted when a transaction is added
    event TransactionAdded(
        address user,
        uint256 month,
        uint256 year,
        uint256 txnId,
        address walletAddress,
        uint256 amount,
        string type_
    );

    // Mapping to store records grouped by user, month, and year
    mapping(bytes32 => Record) public consolidatedByMonth;

    // Mapping to store records grouped by user and year
    mapping(bytes32 => Record) public consolidatedByYear;

    // Struct to represent a record
    struct Record {
        uint256 timeWatched;
        uint256 amountEarned;
    }

    // Struct to represent a transaction
    struct Transaction {
        uint256 txnId;
        address walletAddress;
        uint256 amount;
        string type_; // contentOwner, user, or protocol fees
    }

    // Struct to represent batch increment data
    struct BatchIncrementData {
        address userID;
        uint256 month;
        uint256 year;
        uint256 timeWatched;
        uint256 amountEarned;
    }

    // Mapping to store transactions grouped by user, month, and year
    mapping(bytes32 => Transaction[]) public consolidatedByMonthTransactions;

    // Mapping to store transactions grouped by user and year
    mapping(bytes32 => Transaction[]) public consolidatedByYearTransactions;

    // Set to store all users
    EnumerableSet.AddressSet private allUsers;

    // Constructor function
    constructor() Ownable(msg.sender) Pausable() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        emit AdminAdded(msg.sender); // Emit event to confirm role assignment
        addAdmin(msg.sender);
    }

    modifier onlyAdmin() {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "Only admin can call this function"
        );
        _;
    }

    // Function to add tokens to a user's balance
    function addTokens(
        address user,
        uint256 amount
    ) public onlyAdmin whenNotPaused nonReentrant {
        require(user != address(0), "Invalid user address");
        wallets[user] += amount;
        allUsers.add(user);
    }

    // Function to update a user's balance
    function updateBalance(
        address user,
        uint256 amount
    ) public onlyAdmin whenNotPaused nonReentrant {
        require(user != address(0), "Invalid user address");
        wallets[user] = amount;
        allUsers.add(user);
    }

    // Function to add an admin
    function addAdmin(address newAdmin) public onlyOwner {
        require(newAdmin != address(0), "Invalid admin address");
        grantRole(ADMIN_ROLE, newAdmin);
        emit AdminAdded(newAdmin);
    }

    // Function to remove an admin
    function removeAdmin(address adminToRemove) public onlyOwner {
        require(
            hasRole(ADMIN_ROLE, adminToRemove),
            "Only existing admin can be removed"
        );
        revokeRole(ADMIN_ROLE, adminToRemove);
        emit AdminRemoved(adminToRemove);
    }

    // Function to set the token admin
    function setTokenAdmin(address newTokenAdmin) public onlyOwner {
        require(newTokenAdmin != address(0), "Invalid token admin address");
        tokenAdmin = newTokenAdmin;
        emit TokenAdminSet(newTokenAdmin);
    }

    // Function to pause the contract
    function pause() public onlyAdmin {
        _pause();
    }

    // Function to unpause the contract
    function unpause() public onlyAdmin {
        _unpause();
    }

    // Unified function to increment the time watched and amount earned for a user
    function incrementRecord(
        address userID,
        uint256 month,
        uint256 year,
        uint256 timeWatched,
        uint256 amountEarned
    ) public onlyAdmin whenNotPaused nonReentrant {
        bytes32 keyMonth = keccak256(abi.encodePacked(userID, month, year));
        bytes32 keyYear = keccak256(abi.encodePacked(userID, year));

        // Increment by month/year
        consolidatedByMonth[keyMonth].timeWatched += timeWatched;
        consolidatedByMonth[keyMonth].amountEarned += amountEarned;
        emit RecordIncremented(userID, month, year, timeWatched, amountEarned);

        // Increment by year
        consolidatedByYear[keyYear].timeWatched += timeWatched;
        consolidatedByYear[keyYear].amountEarned += amountEarned;

        allUsers.add(userID);
    }

    // Function to add a transaction
    function addTransaction(
        address userID,
        uint256 month,
        uint256 year,
        uint256 txnId,
        address walletAddress,
        uint256 amount,
        string memory type_
    ) public onlyAdmin whenNotPaused nonReentrant {
        bytes32 keyMonth = keccak256(abi.encodePacked(userID, month, year));
        bytes32 keyYear = keccak256(abi.encodePacked(userID, year));

        // Add transaction by month/year
        consolidatedByMonthTransactions[keyMonth].push(
            Transaction(txnId, walletAddress, amount, type_)
        );
        emit TransactionAdded(
            userID,
            month,
            year,
            txnId,
            walletAddress,
            amount,
            type_
        );

        // Add transaction by year
        consolidatedByYearTransactions[keyYear].push(
            Transaction(txnId, walletAddress, amount, type_)
        );

        allUsers.add(userID);
    }

    // Batch function to increment records for multiple users
    function batchIncrementRecords(
        BatchIncrementData[] calldata data
    ) external onlyAdmin whenNotPaused nonReentrant {
        require(data.length <= 100, "Batch size too large");
        for (uint256 i = 0; i < data.length; i++) {
            incrementRecord(
                data[i].userID,
                data[i].month,
                data[i].year,
                data[i].timeWatched,
                data[i].amountEarned
            );
        }
    }

    // Function to get consolidated records by month
    function getConsolidatedByMonth(
        address userID,
        uint256 month,
        uint256 year
    ) public view returns (Record memory) {
        bytes32 keyMonth = keccak256(abi.encodePacked(userID, month, year));
        return consolidatedByMonth[keyMonth];
    }

    // Function to get consolidated records by year
    function getConsolidatedByYear(address userID, uint256 year)
        public
        view
        returns (Record memory)
    {
        bytes32 keyYear = keccak256(abi.encodePacked(userID, year));
        return consolidatedByYear[keyYear];
    }

    // Function to get transactions by month
    function getTransactionsByMonth(
        address userID,
        uint256 month,
        uint256 year
    ) public view returns (Transaction[] memory) {
        bytes32 keyMonth = keccak256(abi.encodePacked(userID, month, year));
        return consolidatedByMonthTransactions[keyMonth];
    }

    // Function to get transactions by year
    function getTransactionsByYear(address userID, uint256 year)
        public
        view
        returns (Transaction[] memory)
    {
        bytes32 keyYear = keccak256(abi.encodePacked(userID, year));
        return consolidatedByYearTransactions[keyYear];
    }

    // Function to get a summary of a user's records over a specified period (e.g., month, year)
    function getUserSummary(address userID, uint256 month, uint256 year)
        public
        view
        returns (uint256 totalWatched, uint256 totalEarned)
    {
        bytes32 keyMonth = keccak256(abi.encodePacked(userID, month, year));
        Record memory monthlyRecord = consolidatedByMonth[keyMonth];

        totalWatched = monthlyRecord.timeWatched;
        totalEarned = monthlyRecord.amountEarned;

        bytes32 keyYear = keccak256(abi.encodePacked(userID, year));
        Record memory yearlyRecord = consolidatedByYear[keyYear];

        totalWatched += yearlyRecord.timeWatched;
        totalEarned += yearlyRecord.amountEarned;
    }

    // Function to get the total number of transactions for a user over a specified period (e.g., month, year)
    function getTotalTransactionsByUser(address userID, uint256 month, uint256 year)
        public
        view
        returns (uint256 totalTransactions)
    {
        bytes32 keyMonth = keccak256(abi.encodePacked(userID, month, year));
        Transaction[] memory monthlyTransactions = consolidatedByMonthTransactions[keyMonth];

        totalTransactions = monthlyTransactions.length;

        bytes32 keyYear = keccak256(abi.encodePacked(userID, year));
        Transaction[] memory yearlyTransactions = consolidatedByYearTransactions[keyYear];

        totalTransactions += yearlyTransactions.length;
    }

    // Event-based approach for off-chain aggregation

    // Function to emit event for off-chain processing of total earnings by all users
    function emitTotalEarnedByAllUsers(uint256 month, uint256 year) public onlyAdmin {
        for (uint256 i = 0; i < allUsers.length(); i++) {
            address user = allUsers.at(i);
            bytes32 keyMonth = keccak256(abi.encodePacked(user, month, year));
            bytes32 keyYear = keccak256(abi.encodePacked(user, year));
            emit RecordIncremented(user, month, year, consolidatedByMonth[keyMonth].timeWatched, consolidatedByMonth[keyMonth].amountEarned);
            emit RecordIncremented(user, month, year, consolidatedByYear[keyYear].timeWatched, consolidatedByYear[keyYear].amountEarned);
        }
    }

    // Function to emit event for off-chain processing of top earners
    function emitTopEarners(uint256 month, uint256 year) public onlyAdmin {
        for (uint256 i = 0; i < allUsers.length(); i++) {
            address user = allUsers.at(i);
            bytes32 keyMonth = keccak256(abi.encodePacked(user, month, year));
            bytes32 keyYear = keccak256(abi.encodePacked(user, year));
            emit RecordIncremented(user, month, year, consolidatedByMonth[keyMonth].timeWatched, consolidatedByMonth[keyMonth].amountEarned);
            emit RecordIncremented(user, month, year, consolidatedByYear[keyYear].timeWatched, consolidatedByYear[keyYear].amountEarned);
        }
    }

    // Function to get detailed information about a specific user based on their wallet address
    function getUserDetails(address userID)
        public
        view
        returns (
            uint256 balance,
            uint256 nonce,
            uint256 totalWatched,
            uint256 totalEarned
        )
    {
        balance = wallets[userID];
        nonce = nonces[userID];

        // Loop through all records and accumulate the total watched and earned for the user
        for (uint256 year = 2021; year <= 2024; year++) { // Adjust the year range as needed
            bytes32 keyYear = keccak256(abi.encodePacked(userID, year));
            Record memory yearlyRecord = consolidatedByYear[keyYear];
            totalWatched += yearlyRecord.timeWatched;
            totalEarned += yearlyRecord.amountEarned;
        }
    }

    // Function to get a monthly and yearly report for all users' activities
    function getMonthlyYearlyReport(uint256 month, uint256 year)
        public
        view
        returns (address[] memory users, uint256[] memory monthlyWatched, uint256[] memory monthlyEarned, uint256[] memory yearlyWatched, uint256[] memory yearlyEarned)
    {
        uint256 userCount = allUsers.length();
        users = new address[](userCount);
        monthlyWatched = new uint256[](userCount);
        monthlyEarned = new uint256[](userCount);
        yearlyWatched = new uint256[](userCount);
        yearlyEarned = new uint256[](userCount);

        for (uint256 i = 0; i < userCount; i++) {
            address user = allUsers.at(i);
            users[i] = user;

            bytes32 keyMonth = keccak256(abi.encodePacked(user, month, year));
            monthlyWatched[i] = consolidatedByMonth[keyMonth].timeWatched;
            monthlyEarned[i] = consolidatedByMonth[keyMonth].amountEarned;

            bytes32 keyYear = keccak256(abi.encodePacked(user, year));
            yearlyWatched[i] = consolidatedByYear[keyYear].timeWatched;
            yearlyEarned[i] = consolidatedByYear[keyYear].amountEarned;
        }
    }
}