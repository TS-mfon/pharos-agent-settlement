// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEscrowERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract AgentEscrow {
    enum Status { Open, Funded, Submitted, Released, Refunded, Disputed }

    struct Escrow {
        address payer;
        address payable payee;
        address arbiter;
        address asset;
        uint128 amount;
        uint48 deadline;
        Status status;
        bytes32 evidenceHash;
    }

    uint256 public nextEscrowId = 1;
    mapping(uint256 escrowId => Escrow escrow) public escrows;

    event EscrowCreated(uint256 indexed escrowId, address indexed payer, address indexed payee, address asset, uint256 amount, uint48 deadline, address arbiter);
    event EscrowFunded(uint256 indexed escrowId);
    event EvidenceSubmitted(uint256 indexed escrowId, bytes32 evidenceHash);
    event EscrowReleased(uint256 indexed escrowId);
    event EscrowRefunded(uint256 indexed escrowId);
    event EscrowDisputed(uint256 indexed escrowId);

    error Unauthorized();
    error InvalidState();
    error TransferFailed();

    function create(address payable payee, address arbiter, address asset, uint128 amount, uint48 deadline) external returns (uint256 id) {
        if (payee == address(0) || amount == 0 || deadline <= block.timestamp) revert InvalidState();
        id = nextEscrowId++;
        escrows[id] = Escrow(msg.sender, payee, arbiter, asset, amount, deadline, Status.Open, bytes32(0));
        emit EscrowCreated(id, msg.sender, payee, asset, amount, deadline, arbiter);
    }

    function fund(uint256 id) external payable {
        Escrow storage escrow = escrows[id];
        if (msg.sender != escrow.payer || escrow.status != Status.Open) revert Unauthorized();
        escrow.status = Status.Funded;
        if (escrow.asset == address(0)) {
            if (msg.value != escrow.amount) revert InvalidState();
        } else {
            if (msg.value != 0 || !IEscrowERC20(escrow.asset).transferFrom(msg.sender, address(this), escrow.amount)) revert TransferFailed();
        }
        emit EscrowFunded(id);
    }

    function submitEvidence(uint256 id, bytes32 evidenceHash) external {
        Escrow storage escrow = escrows[id];
        if (msg.sender != escrow.payee || escrow.status != Status.Funded || evidenceHash == bytes32(0)) revert Unauthorized();
        escrow.evidenceHash = evidenceHash;
        escrow.status = Status.Submitted;
        emit EvidenceSubmitted(id, evidenceHash);
    }

    function release(uint256 id) external {
        Escrow storage escrow = escrows[id];
        if (msg.sender != escrow.payer && msg.sender != escrow.arbiter) revert Unauthorized();
        if (escrow.status != Status.Funded && escrow.status != Status.Submitted && escrow.status != Status.Disputed) revert InvalidState();
        escrow.status = Status.Released;
        _pay(escrow.asset, escrow.payee, escrow.amount);
        emit EscrowReleased(id);
    }

    function refund(uint256 id) external {
        Escrow storage escrow = escrows[id];
        if (msg.sender != escrow.payee && msg.sender != escrow.arbiter && !(msg.sender == escrow.payer && block.timestamp > escrow.deadline)) revert Unauthorized();
        if (escrow.status != Status.Funded && escrow.status != Status.Submitted && escrow.status != Status.Disputed) revert InvalidState();
        escrow.status = Status.Refunded;
        _pay(escrow.asset, payable(escrow.payer), escrow.amount);
        emit EscrowRefunded(id);
    }

    function dispute(uint256 id) external {
        Escrow storage escrow = escrows[id];
        if (msg.sender != escrow.payer && msg.sender != escrow.payee) revert Unauthorized();
        if (escrow.arbiter == address(0) || (escrow.status != Status.Funded && escrow.status != Status.Submitted)) revert InvalidState();
        escrow.status = Status.Disputed;
        emit EscrowDisputed(id);
    }

    function _pay(address asset, address payable recipient, uint256 amount) private {
        if (asset == address(0)) {
            (bool success,) = recipient.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else if (!IEscrowERC20(asset).transfer(recipient, amount)) {
            revert TransferFailed();
        }
    }
}
