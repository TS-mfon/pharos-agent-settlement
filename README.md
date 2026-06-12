# Pharos Agent Settlement

Reusable policy-controlled payments, batch settlement, invoices, escrow, paid API inspection, proof packaging, and reconciliation for AI agents on Pharos.

## Why it exists

Agents need more than a transfer helper. They need a deterministic economic execution layer that can explain what will happen, enforce bounded authority, produce verifiable receipts, and remain reusable across commerce, research, service, payroll, and treasury workflows.

## Capabilities

- Live Pharos address, token, balance, and authorization inspection
- Three safety modes: `read`, `propose`, and policy-bounded `execute`
- Native/ERC-20 payments and vault-enforced batch settlements
- Deterministic signed-invoice digests
- On-chain milestone escrow and dispute routing
- x402 payment-requirement inspection and payment-enabled fetch
- Pharos `eth_getProof` settlement packages
- Append-only local reconciliation journal

## Quick start

```bash
npm install
npm run build
cp .env.example .env
npm run dev -- inspect --address 0x0000000000000000000000000000000000000000 --token 0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B
npm run dev -- payment --request examples/payment-request.json --policy examples/policy.json
```

The payment command defaults to proposal generation. To execute, set `mode` to `execute`, configure `PHAROS_PRIVATE_KEY`, and use an explicit policy.
Automatic payment execution additionally requires `PHAROS_VAULT_ADDRESS`; the runtime will not use a raw signer transfer as an execution fallback.
For production, configure comma-separated `PHAROS_RPC_URLS`; the runtime retries and falls back across providers.

## Contracts

`AgentPolicyVault` holds agent funds and enforces asset, counterparty, per-transaction, total, time-window, pause, and replay policies. `AgentEscrow` manages funded service delivery. `SettlementRegistry` anchors immutable receipt hashes.

```bash
cd contracts
forge install foundry-rs/forge-std
forge test
PHAROS_RPC_URL=https://atlantic.dplabs-internal.com OWNER_ADDRESS=0x... forge script script/Deploy.s.sol:Deploy --rpc-url atlantic --broadcast
```

## Agent integration

Install or copy [`skill/`](skill/) into an agent's skills directory. The skill instructs agents to use deterministic CLI commands and prevents language models from directly constructing arbitrary calls.

## Current boundary

The module packages Pharos `eth_getProof` results and verifies package integrity. Full local verification of Pharos' SHA-256 hexary trie is not yet implemented. x402 execution requires an endpoint advertising `eip155:688689`, a compatible facilitator, and an explicitly configured signer.
