// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentPolicyVault.sol";
import "../src/AgentEscrow.sol";
import "../src/SettlementRegistry.sol";

contract MockToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function approve(address spender, uint256 amount) external returns (bool) { allowance[msg.sender][spender] = amount; return true; }
    function transfer(address to, uint256 amount) external returns (bool) { return transferFrom(msg.sender, to, amount); }
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        if (from != msg.sender) {
            uint256 allowed = allowance[from][msg.sender];
            require(allowed >= amount);
            allowance[from][msg.sender] = allowed - amount;
        }
        require(balanceOf[from] >= amount);
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract SettlementTest is Test {
    address owner = makeAddr("owner");
    address agent = makeAddr("agent");
    address payee = makeAddr("payee");
    address arbiter = makeAddr("arbiter");
    AgentPolicyVault vault;
    AgentEscrow escrow;
    SettlementRegistry registry;
    MockToken token;

    function setUp() external {
        vault = new AgentPolicyVault(owner);
        escrow = new AgentEscrow();
        registry = new SettlementRegistry();
        token = new MockToken();
        token.mint(address(vault), 1_000 ether);
    }

    function _setPolicy(uint128 perTx, uint128 total) private {
        vm.prank(owner);
        vault.setPolicy(agent, AgentPolicyVault.Policy(true, address(token), payee, perTx, total, 0, 0, uint48(block.timestamp + 1 days)));
    }

    function testPolicyPaymentAndReplayProtection() external {
        _setPolicy(100 ether, 200 ether);
        bytes32 actionId = keccak256("one");
        vm.prank(agent);
        vault.executePayment(actionId, address(token), payable(payee), 50 ether);
        assertEq(token.balanceOf(payee), 50 ether);
        vm.expectRevert(AgentPolicyVault.ActionAlreadyExecuted.selector);
        vm.prank(agent);
        vault.executePayment(actionId, address(token), payable(payee), 50 ether);
    }

    function testRejectsLimitAndCounterpartyViolations() external {
        _setPolicy(50 ether, 100 ether);
        vm.expectRevert(AgentPolicyVault.PolicyViolation.selector);
        vm.prank(agent);
        vault.executePayment(keccak256("limit"), address(token), payable(payee), 51 ether);
        vm.expectRevert(AgentPolicyVault.PolicyViolation.selector);
        vm.prank(agent);
        vault.executePayment(keccak256("recipient"), address(token), payable(address(123)), 10 ether);
    }

    function testBatchPaymentsAccumulatePolicySpend() external {
        _setPolicy(100 ether, 200 ether);
        bytes32[] memory ids = new bytes32[](2);
        address[] memory assets = new address[](2);
        address payable[] memory counterparties = new address payable[](2);
        uint128[] memory amounts = new uint128[](2);
        for (uint256 i; i < 2; ++i) {
            ids[i] = bytes32(i + 1);
            assets[i] = address(token);
            counterparties[i] = payable(payee);
            amounts[i] = 75 ether;
        }
        vm.prank(agent);
        vault.executeBatchPayments(ids, assets, counterparties, amounts);
        assertEq(token.balanceOf(payee), 150 ether);
    }

    function testEscrowLifecycle() external {
        token.mint(owner, 100 ether);
        vm.startPrank(owner);
        token.approve(address(escrow), 100 ether);
        uint256 id = escrow.create(payable(payee), arbiter, address(token), 100 ether, uint48(block.timestamp + 1 days));
        escrow.fund(id);
        vm.stopPrank();
        vm.prank(payee);
        escrow.submitEvidence(id, keccak256("delivery"));
        vm.prank(owner);
        escrow.release(id);
        assertEq(token.balanceOf(payee), 100 ether);
    }

    function testRegistryCannotOverwriteReceipt() external {
        bytes32 actionId = keccak256("receipt");
        registry.record(actionId, keccak256("intent"), keccak256("result"));
        vm.expectRevert(SettlementRegistry.AlreadyRecorded.selector);
        registry.record(actionId, keccak256("other"), keccak256("other"));
    }
}
