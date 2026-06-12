// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SettlementRegistry {
    struct Receipt {
        address submitter;
        bytes32 intentHash;
        bytes32 resultHash;
        uint48 timestamp;
    }

    mapping(bytes32 actionId => Receipt receipt) public receipts;
    event SettlementRecorded(bytes32 indexed actionId, address indexed submitter, bytes32 indexed intentHash, bytes32 resultHash);
    error AlreadyRecorded();

    function record(bytes32 actionId, bytes32 intentHash, bytes32 resultHash) external {
        if (receipts[actionId].timestamp != 0) revert AlreadyRecorded();
        receipts[actionId] = Receipt(msg.sender, intentHash, resultHash, uint48(block.timestamp));
        emit SettlementRecorded(actionId, msg.sender, intentHash, resultHash);
    }
}
