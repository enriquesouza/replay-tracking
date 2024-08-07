// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library ReplayLibrary {
   
    struct Transaction {
        uint256 day;
        uint256 month;
        uint256 year;
        string txnId;
        address walletAddress;
        uint256 amount;
        string type_;

        uint256 timeWatched;
        uint256 amountEarned;

        address userID;
        string movieId;
    }


    function encodeKey(
        address userID,
        uint256 month,
        uint256 year,
        uint256 day,
        string memory movieId
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(userID, month, year, day, movieId));
    }

    function encodeMonthKey(
        address userID,
        uint256 month,
        uint256 year
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(userID, month, year));
    }

    function encodeYearKey(
        address userID,
        uint256 year
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(userID, year));
    }
}
