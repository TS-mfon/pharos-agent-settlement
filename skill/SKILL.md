---
name: pharos-agent-settlement
description: Policy-controlled economic execution for AI agents on Pharos. Use when an agent needs to inspect Pharos assets, enforce a spending budget, propose or execute payments, batch settlements, create invoices, manage escrow, inspect paid x402 APIs, generate settlement proofs, or reconcile past actions.
---

# Pharos Agent Settlement

Use the deterministic `pharos-settlement` CLI. Never place private keys in prompts, command arguments, logs, or generated files.

## Safety workflow

1. Run `inspect` before using an unfamiliar address or token.
2. Default every write to `propose`.
3. Require an explicit policy file before `execute`.
4. Check the returned transaction target, asset, counterparty, amount, estimated cost, and policy decision.
5. Execute only after the proposal matches intent.
6. Run `reconcile` and create a proof after settlement.

Modes:
- `read`: perform no write and do not construct an executable request.
- `propose`: validate and return transaction calldata without signing. This is the default.
- `execute`: sign only when an explicit policy allows the action.

## Commands

```bash
pharos-settlement inspect --address 0x... [--token 0x...]
pharos-settlement payment --request request.json [--policy policy.json]
pharos-settlement policy-check --request request.json --policy policy.json
pharos-settlement policy-admin --input policy-action.json [--mode propose|execute]
pharos-settlement batch-payment --input payments.json [--mode propose|execute]
pharos-settlement invoice-create --input invoice.json
pharos-settlement invoice-sign --input invoice.json
pharos-settlement invoice-verify --input invoice.json --signature 0x... --signer 0x...
pharos-settlement escrow --input escrow-action.json [--mode propose|execute]
pharos-settlement x402-inspect --url https://...
pharos-settlement x402-buy --url https://...
pharos-settlement proof-create --address 0x...
pharos-settlement proof-verify --input proof.json
pharos-settlement receipt-anchor --input receipt.json [--mode propose|execute]
pharos-settlement reconcile
```

Read [references/actions.md](references/actions.md) for schemas and examples. Read [references/pharos.md](references/pharos.md) before changing network assets or contracts. Read [references/security.md](references/security.md) before enabling `execute`.
