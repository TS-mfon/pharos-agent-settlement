# Architecture

Pharos Agent Settlement separates language-model intent from deterministic execution.

```text
Agent prompt
   |
   v
SKILL.md routing and safety rules
   |
   v
Typed JSON request -> Zod validation -> local policy decision
   |
   +--> propose: return inspectable calldata
   |
   +--> execute: dedicated signer -> Pharos Atlantic
                                  |
                                  +--> AgentPolicyVault
                                  +--> AgentEscrow
                                  +--> SettlementRegistry
   |
   v
Receipt journal + eth_getProof package
```

## Trust boundaries

- The language model may select a known command and populate typed fields.
- The language model cannot pass arbitrary calldata through the CLI.
- The local policy engine provides fast rejection and explainability.
- `AgentPolicyVault` is the authoritative execution boundary for delegated payments.
- Signers are supplied only through process environment or an external signer adapter.
- Counterparties, tokens, x402 endpoints, facilitators, evidence, and arbiters are untrusted.

## Pharos integration

- Atlantic testnet is the default development network.
- The runtime performs live contract and token capability inspection.
- Policy-vault batch execution groups independent payments into one transaction while preserving per-payment policy checks.
- x402 uses EIP-3009-compatible Atlantic USDC and rejects other networks/assets or values above the configured cap.
- Proof packages bind Pharos block metadata and `eth_getProof` output to a deterministic integrity hash.

## Extension points

- Safe or ERC-4337 signer adapters can implement the existing signer boundary.
- Arbitration agents can resolve disputed escrow through the arbiter role.
- Full SHA-256 hexary-trie verification can replace package-integrity verification without changing the proof command interface.
- Settlement Registry receipts can be indexed into a cross-agent reputation system.
