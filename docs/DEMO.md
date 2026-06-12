# Judge Demo

## 1. Show reusable agent discovery

Open `skill/SKILL.md` and show that a general agent can discover payments, policies, escrow, x402, proofs, and reconciliation.

## 2. Inspect Pharos assets

```bash
npm run dev -- inspect \
  --address 0x0000000000000000000000000000000000000001 \
  --token 0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B
```

Highlight live token metadata and EIP-3009 authorization capability detection.

## 3. Explain a policy decision

```bash
node dist/cli.js policy-check --request examples/payment-request.json --policy examples/policy.json
node dist/cli.js payment --request examples/payment-request.json --policy examples/policy.json
```

The first command explains whether the action is allowed. The second returns safe proposal calldata without signing.

## 4. Show broad composability

```bash
PHAROS_ESCROW_ADDRESS=0x... node dist/cli.js escrow --input examples/escrow-create.json
PHAROS_VAULT_ADDRESS=0x... node dist/cli.js batch-payment --input examples/batch-payments.json
node dist/cli.js invoice-create --input examples/invoice.json
node dist/cli.js x402-inspect --url https://your-pharos-x402-service.example/data
node dist/cli.js proof-create --address 0x...
node dist/cli.js reconcile
```

## 5. Show technical quality

```bash
npm run build
npm test
cd contracts && forge test
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py ../skill
```
