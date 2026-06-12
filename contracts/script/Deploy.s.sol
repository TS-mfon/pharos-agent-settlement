// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentPolicyVault.sol";
import "../src/AgentEscrow.sol";
import "../src/SettlementRegistry.sol";

contract Deploy is Script {
    function run() external returns (AgentPolicyVault vault, AgentEscrow escrow, SettlementRegistry registry) {
        address owner = vm.envAddress("OWNER_ADDRESS");
        vm.startBroadcast();
        vault = new AgentPolicyVault(owner);
        escrow = new AgentEscrow();
        registry = new SettlementRegistry();
        vm.stopBroadcast();
    }
}
