// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts47/security/Pausable.sol";
import "@openzeppelin/contracts47/access/Ownable.sol";
import "@openzeppelin/contracts47/access/AccessControl.sol";
import "@openzeppelin/contracts47/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts47/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts47/utils/Address.sol";

import "./ReplayLibrary.sol";

contract ReplayTrackingContractV2 is
    Ownable,
    ReentrancyGuard,
    Pausable,
    AccessControl
{
    using EnumerableSet for EnumerableSet.AddressSet;
    using Address for address;
    using ReplayLibrary for ReplayLibrary.Transaction;

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
        uint256 day,
        string movieId,
        uint256 timeWatched,
        uint256 amountEarned
    );

    // Event emitted when a transaction is added
    event TransactionAdded(
        address user,
        uint256 month,
        uint256 year,
        uint256 day,
        string txnId,
        address walletAddress,
        uint256 amount,
        string type_
    );

    // Mappings to store records and transactions
    mapping(bytes32 => ReplayLibrary.Transaction) public consolidatedByMovie;
    mapping(bytes32 => ReplayLibrary.Transaction) public consolidatedByMonth;
    mapping(bytes32 => ReplayLibrary.Transaction) public consolidatedByYear;
    mapping(bytes32 => ReplayLibrary.Transaction[])
        public consolidatedByMonthTransactions;
    mapping(bytes32 => ReplayLibrary.Transaction[])
        public consolidatedByYearTransactions;
    mapping(bytes32 => ReplayLibrary.Transaction[]) public dailyTransactions;

    // Set to store all users
    EnumerableSet.AddressSet private allUsers;

    // Constructor function
    constructor() Ownable() Pausable() {
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
        uint256 day,
        string memory movieId,
        uint256 timeWatched,
        uint256 amountEarned
    ) public onlyAdmin whenNotPaused {
        bytes32 keyMovie = ReplayLibrary.encodeKey(
            userID,
            month,
            year,
            day,
            movieId
        );
        bytes32 keyMonth = ReplayLibrary.encodeMonthKey(userID, month, year);
        bytes32 keyYear = ReplayLibrary.encodeYearKey(userID, year);

        // Increment by movie
        consolidatedByMovie[keyMovie].timeWatched += timeWatched;
        consolidatedByMovie[keyMovie].amountEarned += amountEarned;

        // Increment by month/year
        consolidatedByMonth[keyMonth].timeWatched += timeWatched;
        consolidatedByMonth[keyMonth].amountEarned += amountEarned;
        emit RecordIncremented(
            userID,
            month,
            year,
            day,
            movieId,
            timeWatched,
            amountEarned
        );

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
        uint256 day,
        string memory txnId,
        address walletAddress,
        uint256 amount,
        string memory type_
    ) public onlyAdmin whenNotPaused nonReentrant {
        bytes32 keyMonth = ReplayLibrary.encodeMonthKey(userID, month, year);
        bytes32 keyYear = ReplayLibrary.encodeYearKey(userID, year);
        bytes32 keyDay = ReplayLibrary.encodeKey(userID, month, year, day, "0");

        // Add transaction by month/year
        consolidatedByMonthTransactions[keyMonth].push(
            ReplayLibrary.Transaction(txnId, walletAddress, amount, type_)
        );
        emit TransactionAdded(
            userID,
            month,
            year,
            day,
            txnId,
            walletAddress,
            amount,
            type_
        );

        // Add transaction by year
        consolidatedByYearTransactions[keyYear].push(
            ReplayLibrary.Transaction(txnId, walletAddress, amount, type_)
        );

        // Add daily transaction
        dailyTransactions[keyDay].push(
            ReplayLibrary.DailyTransaction(
                day,
                month,
                year,
                txnId,
                walletAddress,
                amount,
                type_
            )
        );

        allUsers.add(userID);
    }

    // Batch function to increment records for multiple users
    // Removed the reentrant since we want to insert in batches and only admin can add
    function batchIncrementRecords(
        ReplayLibrary.Transaction[] calldata data
    ) external onlyAdmin whenNotPaused {
        require(data.length <= 100, "Batch size too large");
        for (uint256 i = 0; i < data.length; i++) {
            incrementRecord(
                data[i].userID,
                data[i].month,
                data[i].year,
                data[i].day,
                data[i].movieId,
                data[i].timeWatched,
                data[i].amountEarned
            );
        }
    }

    // Function to get consolidated records by movie
    function getConsolidatedByMovie(
        address userID,
        uint256 month,
        uint256 year,
        uint256 day,
        string memory movieId
    ) public view returns (uint256 timeWatched, uint256 amountEarned) {
        bytes32 keyMovie = ReplayLibrary.encodeKey(
            userID,
            month,
            year,
            day,
            movieId
        );
        ReplayLibrary.Transaction memory record = consolidatedByMovie[keyMovie];
        return (record.timeWatched, record.amountEarned);
    }

    // Function to get consolidated records by month
    function getConsolidatedByMonth(
        address userID,
        uint256 month,
        uint256 year
    ) public view returns (uint256 timeWatched, uint256 amountEarned) {
        bytes32 keyMonth = ReplayLibrary.encodeMonthKey(userID, month, year);
        ReplayLibrary.Transaction memory record = consolidatedByMonth[keyMonth];
        return (record.timeWatched, record.amountEarned);
    }

    // Function to get consolidated records by year
    function getConsolidatedByYear(
        address userID,
        uint256 year
    ) public view returns (uint256 timeWatched, uint256 amountEarned) {
        bytes32 keyYear = ReplayLibrary.encodeYearKey(userID, year);
        ReplayLibrary.Transaction memory record = consolidatedByYear[keyYear];
        return (record.timeWatched, record.amountEarned);
    }

    // Function to get transactions by month
    function getTransactionsByMonth(
        address userID,
        uint256 month,
        uint256 year
    ) public view returns (ReplayLibrary.Transaction[] memory) {
        bytes32 keyMonth = ReplayLibrary.encodeMonthKey(userID, month, year);
        return consolidatedByMonthTransactions[keyMonth];
    }

    // Function to get transactions by year
    function getTransactionsByYear(
        address userID,
        uint256 year
    ) public view returns (ReplayLibrary.Transaction[] memory) {
        bytes32 keyYear = ReplayLibrary.encodeYearKey(userID, year);
        return consolidatedByYearTransactions[keyYear];
    }

    // Function to get daily transactions
    function getDailyTransactions(
        address userID,
        uint256 month,
        uint256 year,
        uint256 day
    ) public view returns (ReplayLibrary.Transaction[] memory) {
        bytes32 keyDay = ReplayLibrary.encodeKey(userID, month, year, day, "0");
        return dailyTransactions[keyDay];
    }

    // Function to get a summary of a user's records over a specified period (e.g., month, year)
    function getUserSummary(
        address userID,
        uint256 month,
        uint256 year
    ) public view returns (uint256 totalWatched, uint256 totalEarned) {
        // Reset the totals
        totalWatched = 0;
        totalEarned = 0;

        // Get the monthly record if a specific month is requested
        if (month != 0) {
            bytes32 keyMonth = ReplayLibrary.encodeMonthKey(
                userID,
                month,
                year
            );
            ReplayLibrary.Transaction memory monthlyRecord = consolidatedByMonth[
                keyMonth
            ];
            totalWatched = monthlyRecord.timeWatched;
            totalEarned = monthlyRecord.amountEarned;
        }

        // Get the yearly record
        bytes32 keyYear = ReplayLibrary.encodeYearKey(userID, year);
        ReplayLibrary.Transaction memory yearlyRecord = consolidatedByYear[keyYear];
        totalWatched += yearlyRecord.timeWatched;
        totalEarned += yearlyRecord.amountEarned;

        // If a specific month is requested, subtract that month's record from the yearly total
        if (month != 0) {
            bytes32 keyMonth = ReplayLibrary.encodeMonthKey(
                userID,
                month,
                year
            );
            ReplayLibrary.Transaction memory monthlyRecord = consolidatedByMonth[
                keyMonth
            ];
            totalWatched -= monthlyRecord.timeWatched;
            totalEarned -= monthlyRecord.amountEarned;
        }
    }

    // Function to get the total number of transactions for a user over a specified period (e.g., month, year)
    function getTotalTransactionsByUser(
        address userID,
        uint256 month,
        uint256 year
    ) public view returns (uint256 totalTransactions) {
        bytes32 keyMonth = ReplayLibrary.encodeMonthKey(userID, month, year);
        ReplayLibrary.Transaction[]
            memory monthlyTransactions = consolidatedByMonthTransactions[
                keyMonth
            ];

        bytes32 keyYear = ReplayLibrary.encodeYearKey(userID, year);
        ReplayLibrary.Transaction[]
            memory yearlyTransactions = consolidatedByYearTransactions[keyYear];

        if (monthlyTransactions.length == 0 && yearlyTransactions.length == 0) {
            return 0;
        }

        totalTransactions = monthlyTransactions.length;

        // Calcula o total de transações anuais excluindo as transações mensais duplicadas
        uint256 uniqueYearlyTransactions = yearlyTransactions.length;
        for (uint256 i = 0; i < monthlyTransactions.length; i++) {
            for (uint256 j = 0; j < yearlyTransactions.length; j++) {
                if (
                    keccak256(abi.encode(monthlyTransactions[i])) ==
                    keccak256(abi.encode(yearlyTransactions[j]))
                ) {
                    uniqueYearlyTransactions--;
                    break;
                }
            }
        }

        totalTransactions += uniqueYearlyTransactions;
    }

    // Event-based approach for off-chain aggregation

    // Function to emit event for off-chain processing of total earnings by all users
    function emitTotalEarnedByAllUsers(
        uint256 month,
        uint256 year
    ) public onlyAdmin {
        for (uint256 i = 0; i < allUsers.length(); i++) {
            address user = allUsers.at(i);
            bytes32 keyMonth = ReplayLibrary.encodeMonthKey(user, month, year);
            bytes32 keyYear = ReplayLibrary.encodeYearKey(user, year);
            emit RecordIncremented(
                user,
                month,
                year,
                0,
                "",
                consolidatedByMonth[keyMonth].timeWatched,
                consolidatedByMonth[keyMonth].amountEarned
            );
            emit RecordIncremented(
                user,
                month,
                year,
                0,
                "",
                consolidatedByYear[keyYear].timeWatched,
                consolidatedByYear[keyYear].amountEarned
            );
        }
    }

    // Function to emit event for off-chain processing of top earners
    function emitTopEarners(uint256 month, uint256 year) public onlyAdmin {
        for (uint256 i = 0; i < allUsers.length(); i++) {
            address user = allUsers.at(i);
            bytes32 keyMonth = ReplayLibrary.encodeMonthKey(user, month, year);
            bytes32 keyYear = ReplayLibrary.encodeYearKey(user, year);
            emit RecordIncremented(
                user,
                month,
                year,
                0,
                "",
                consolidatedByMonth[keyMonth].timeWatched,
                consolidatedByMonth[keyMonth].amountEarned
            );
            emit RecordIncremented(
                user,
                month,
                year,
                0,
                "",
                consolidatedByYear[keyYear].timeWatched,
                consolidatedByYear[keyYear].amountEarned
            );
        }
    }

    // Function to get detailed information about a specific user based on their wallet address
    function getUserDetails(
        address userID,
        uint256 topYear
    )
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
        for (uint256 year = 2021; year <= topYear; year++) {
            bytes32 keyYear = ReplayLibrary.encodeYearKey(userID, year);
            ReplayLibrary.Transaction memory yearlyRecord = consolidatedByYear[
                keyYear
            ];
            totalWatched += yearlyRecord.timeWatched;
            totalEarned += yearlyRecord.amountEarned;
        }
    }

    // Function to get a monthly and yearly report for all users' activities
    function getMonthlyYearlyReport(
        uint256 month,
        uint256 year
    )
        public
        view
        returns (
            address[] memory users,
            uint256[] memory monthlyWatched,
            uint256[] memory monthlyEarned,
            uint256[] memory yearlyWatched,
            uint256[] memory yearlyEarned
        )
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

            bytes32 keyMonth = ReplayLibrary.encodeMonthKey(user, month, year);
            if (
                consolidatedByMonth[keyMonth].timeWatched != 0 ||
                consolidatedByMonth[keyMonth].amountEarned != 0
            ) {
                monthlyWatched[i] = consolidatedByMonth[keyMonth].timeWatched;
                monthlyEarned[i] = consolidatedByMonth[keyMonth].amountEarned;
            } else {
                monthlyWatched[i] = 0;
                monthlyEarned[i] = 0;
            }

            bytes32 keyYear = ReplayLibrary.encodeYearKey(user, year);
            if (
                consolidatedByYear[keyYear].timeWatched != 0 ||
                consolidatedByYear[keyYear].amountEarned != 0
            ) {
                yearlyWatched[i] = consolidatedByYear[keyYear].timeWatched;
                yearlyEarned[i] = consolidatedByYear[keyYear].amountEarned;
            } else {
                yearlyWatched[i] = 0;
                yearlyEarned[i] = 0;
            }
        }
    }
}
