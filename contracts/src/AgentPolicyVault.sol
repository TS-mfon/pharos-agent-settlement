// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @notice Policy-bounded treasury that lets an owner delegate tightly scoped payments to agents.
contract AgentPolicyVault {
    struct Policy {
        bool active;
        address asset;
        address counterparty;
        uint128 perTransactionLimit;
        uint128 totalLimit;
        uint128 spent;
        uint48 validAfter;
        uint48 validUntil;
    }

    address public owner;
    bool public paused;
    mapping(address agent => Policy policy) public policies;
    mapping(bytes32 actionId => bool executed) public executedActions;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PolicySet(address indexed agent, address indexed asset, address indexed counterparty, uint256 perTransactionLimit, uint256 totalLimit, uint48 validAfter, uint48 validUntil);
    event PolicyRevoked(address indexed agent);
    event PaymentExecuted(bytes32 indexed actionId, address indexed agent, address indexed asset, address counterparty, uint256 amount);
    event Paused(bool paused);

    error Unauthorized();
    error InvalidPolicy();
    error PolicyViolation();
    error ActionAlreadyExecuted();
    error TransferFailed();

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert InvalidPolicy();
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    receive() external payable {}

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidPolicy();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setPaused(bool value) external onlyOwner {
        paused = value;
        emit Paused(value);
    }

    function setPolicy(address agent, Policy calldata policy) external onlyOwner {
        if (
            agent == address(0) || !policy.active || policy.perTransactionLimit == 0
                || policy.totalLimit < policy.perTransactionLimit || policy.validUntil <= policy.validAfter
        ) revert InvalidPolicy();
        policies[agent] = policy;
        emit PolicySet(agent, policy.asset, policy.counterparty, policy.perTransactionLimit, policy.totalLimit, policy.validAfter, policy.validUntil);
    }

    function revokePolicy(address agent) external onlyOwner {
        delete policies[agent];
        emit PolicyRevoked(agent);
    }

    function executePayment(bytes32 actionId, address asset, address payable counterparty, uint128 amount) external {
        _executePayment(actionId, asset, counterparty, amount);
    }

    function executeBatchPayments(bytes32[] calldata actionIds, address[] calldata assets, address payable[] calldata counterparties, uint128[] calldata amounts) external {
        uint256 length = actionIds.length;
        if (length == 0 || length > 100 || assets.length != length || counterparties.length != length || amounts.length != length) revert InvalidPolicy();
        for (uint256 i; i < length; ++i) {
            _executePayment(actionIds[i], assets[i], counterparties[i], amounts[i]);
        }
    }

    function _executePayment(bytes32 actionId, address asset, address payable counterparty, uint128 amount) private {
        if (paused) revert PolicyViolation();
        if (executedActions[actionId]) revert ActionAlreadyExecuted();

        Policy storage policy = policies[msg.sender];
        if (
            !policy.active || policy.asset != asset || (policy.counterparty != address(0) && policy.counterparty != counterparty)
                || block.timestamp < policy.validAfter || block.timestamp > policy.validUntil || amount > policy.perTransactionLimit
                || uint256(policy.spent) + amount > policy.totalLimit
        ) revert PolicyViolation();

        executedActions[actionId] = true;
        policy.spent += amount;

        if (asset == address(0)) {
            (bool success,) = counterparty.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else if (!IERC20(asset).transfer(counterparty, amount)) {
            revert TransferFailed();
        }

        emit PaymentExecuted(actionId, msg.sender, asset, counterparty, amount);
    }

    function withdraw(address asset, address payable recipient, uint256 amount) external onlyOwner {
        if (asset == address(0)) {
            (bool success,) = recipient.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else if (!IERC20(asset).transfer(recipient, amount)) {
            revert TransferFailed();
        }
    }
}
