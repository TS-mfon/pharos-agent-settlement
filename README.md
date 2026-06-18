# Pharos Agent Settlement

Policy-controlled payments, milestone escrow, paid API access, invoice signing, receipt anchoring, proof packaging, and reconciliation for AI agents operating on Pharos.

`pharos-agent-settlement` is a reusable Skill-to-Agent module. It is not a single agent or a demo transfer script. It gives any agent a deterministic settlement layer with typed JSON inputs, local policy checks, on-chain spending controls, proposal-first transaction generation, auditable receipts, and Pharos-specific network integration.

## Contents

- [System Purpose](#system-purpose)
- [Technical Architecture](#technical-architecture)
- [Core Capabilities](#core-capabilities)
- [Repository Layout](#repository-layout)
- [Network Integration](#network-integration)
- [Security Model](#security-model)
- [Installation](#installation)
- [Configuration](#configuration)
- [CLI Reference](#cli-reference)
- [JSON Interfaces](#json-interfaces)
- [Smart Contracts](#smart-contracts)
- [x402 Paid API Flow](#x402-paid-api-flow)
- [Proof and Receipt Model](#proof-and-receipt-model)
- [Agent Skill Integration](#agent-skill-integration)
- [Deployment Runbook](#deployment-runbook)
- [Testing and Verification](#testing-and-verification)
- [Demo Scenarios](#demo-scenarios)
- [Known Boundaries](#known-boundaries)

## System Purpose

Autonomous agents need more than wallet access. A useful on-chain agent must be able to explain, bound, execute, and audit economic actions without letting a language model directly construct arbitrary transactions.

This module separates those responsibilities:

- Agents express intent through typed JSON.
- The runtime validates schemas with `zod`.
- The policy engine explains whether an action is allowed.
- The CLI returns proposal calldata by default.
- The on-chain vault enforces hard spending limits for delegated execution.
- Receipts and proof packages provide machine-readable settlement evidence.

The intended users are agent builders, Pharos hackathon participants, paid API providers, service marketplaces, research agents, payroll agents, treasury agents, and agent-to-agent commerce systems.

## Technical Architecture

```text
AI agent or orchestrator
        |
        v
skill/SKILL.md routing rules
        |
        v
pharos-settlement CLI
        |
        v
Zod schema validation -> local policy engine -> mode router
        |
        +-- read: live inspection, proof reads, reconciliation
        |
        +-- propose: deterministic calldata, no signature
        |
        +-- execute: signer + on-chain policy boundary
        |
        v
Pharos Atlantic contracts
        |
        +-- AgentPolicyVault
        +-- AgentEscrow
        +-- SettlementRegistry
        |
        v
JSON result, receipt journal, proof package
```

The language model is not trusted to create arbitrary calldata. It can select a known command and provide typed parameters. Transaction construction is handled by deterministic TypeScript code using `viem` ABI encoding.

## Core Capabilities

### 1. Address, Token, and Capability Inspection

`inspect` checks an address on Pharos and optionally inspects a token contract:

- Native balance.
- Contract code presence.
- Latest observed block number.
- ERC-20 `name`, `symbol`, `decimals`, and `balanceOf`.
- EIP-3009-style `authorizationState` support for x402-compatible payment flows.

This is used before approving, paying, buying API access, or selecting a settlement asset.

### 2. Proposal-First Payments

`payment` converts a typed `ActionRequest` into deterministic transaction calldata. The default mode is `propose`, so no funds move unless a caller explicitly sets `execute`.

Supported payment paths:

- Direct native PHRS proposal.
- Direct ERC-20 transfer proposal.
- Vault-routed execution when `PHAROS_VAULT_ADDRESS` is configured.

Automatic execution does not fall back to raw signer transfers. If `mode` is `execute`, payment execution requires the on-chain `AgentPolicyVault`.

### 3. Policy Checks and Administration

`policy-check` evaluates a payment request against a local policy and returns:

- `allowed`.
- Human-readable rejection reasons.
- Remaining total budget.

`policy-admin` proposes or executes vault administration:

- Set an agent policy.
- Revoke an agent policy.
- Pause or unpause the vault.

The local policy engine is for fast UX and explainability. The vault is the hard execution boundary.

### 4. Vault-Enforced Batch Settlement

`batch-payment` encodes a batch call to `AgentPolicyVault.executeBatchPayments`.

The vault checks every item independently:

- Unique action ID.
- Active agent policy.
- Asset match.
- Optional counterparty match.
- Time-window validity.
- Per-transaction limit.
- Total policy budget.
- Replay protection.

Batch execution is capped at 100 payments per call.

### 5. Signed Invoices

`invoice-create`, `invoice-sign`, and `invoice-verify` produce deterministic invoice IDs and EIP-191 signatures over typed invoice digests.

Invoices include:

- Recipient.
- Optional asset.
- Amount in smallest units.
- Deadline.
- Purpose string.
- Metadata hash.

This lets an agent request payment without immediately executing a transaction.

### 6. Milestone Escrow

`escrow` encodes actions against `AgentEscrow`:

- Create escrow.
- Fund escrow.
- Submit evidence.
- Release funds.
- Refund funds.
- Open dispute.

Escrow supports native PHRS and ERC-20 assets. The arbiter role is optional at creation but required for dispute resolution.

### 7. x402 Paid API Access

`x402-inspect` checks whether an endpoint returns HTTP 402 payment requirements.

`x402-buy` performs a payment-enabled fetch through `@x402/fetch` and `@x402/evm` when all safety gates pass:

- `PHAROS_PRIVATE_KEY` is configured.
- `PHAROS_X402_MAX_AMOUNT` is configured.
- The endpoint advertises `eip155:688689`.
- The requested asset matches configured Atlantic USDC.
- The requested amount is below the configured cap.

This lets an agent buy API access while keeping price and asset policy outside the prompt.

### 8. Receipt Anchoring

`receipt-anchor` encodes a call to `SettlementRegistry.record`.

The registry stores:

- `actionId`.
- `intentHash`.
- `resultHash`.
- `submitter`.
- Timestamp.

Receipts are immutable; the same `actionId` cannot be overwritten.

### 9. Proof Packaging

`proof-create` queries Pharos `eth_getProof` for an address and packages:

- Chain ID.
- Block number.
- Block hash.
- State root.
- Subject address.
- Storage keys.
- Raw account/storage proof.
- Deterministic package hash.

`proof-verify` currently verifies package integrity and metadata shape. Full local verification of Pharos' SHA-256 hexary trie is a documented extension point.

### 10. Reconciliation Journal

Every proposed or executed payment result is appended to `settlement-journal.jsonl` or the file configured with `PHAROS_JOURNAL_PATH`.

`reconcile` reads the journal and returns prior action results for auditing and recovery.

## Repository Layout

```text
.
├── contracts/
│   ├── src/
│   │   ├── AgentPolicyVault.sol
│   │   ├── AgentEscrow.sol
│   │   └── SettlementRegistry.sol
│   ├── test/
│   │   └── Settlement.t.sol
│   └── script/
│       └── Deploy.s.sol
├── src/
│   ├── cli.ts
│   ├── commands/
│   │   ├── batch.ts
│   │   ├── escrow.ts
│   │   ├── inspect.ts
│   │   ├── invoice.ts
│   │   ├── payment.ts
│   │   ├── policy.ts
│   │   ├── proof.ts
│   │   ├── receipt.ts
│   │   └── x402.ts
│   ├── contracts/
│   │   └── abis.ts
│   └── core/
│       ├── client.ts
│       ├── config.ts
│       ├── journal.ts
│       ├── policy.ts
│       └── schema.ts
├── skill/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── references/
│   └── scripts/validate-network.sh
├── examples/
├── docs/
├── test/
└── package.json
```

## Network Integration

Default network: Pharos Atlantic Testnet.

| Item | Value |
| --- | --- |
| Chain ID | `688689` |
| Native token | `PHRS` |
| RPC | `https://atlantic.dplabs-internal.com` |
| Explorer | `https://atlantic.pharosscan.xyz` |
| x402-compatible USDC candidate | `0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| ERC-4337 EntryPoint | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` |
| MultiCall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |

The runtime supports multiple RPC URLs through `PHAROS_RPC_URLS`. Values are comma-separated and tried with `viem` fallback transport.

```bash
PHAROS_RPC_URLS=https://provider-a.example,https://provider-b.example
```

The included network validator checks the official Atlantic RPC and confirms the configured USDC symbol:

```bash
./skill/scripts/validate-network.sh
```

## Security Model

The module is designed around least authority.

| Layer | Responsibility |
| --- | --- |
| Agent prompt | Select a known skill command and provide typed intent |
| `SKILL.md` | Instruct agents to inspect first, propose by default, and avoid secrets |
| Zod schemas | Reject malformed addresses, hashes, modes, amounts, and invoices |
| Local policy engine | Explain decisions before a write is attempted |
| CLI mode router | Separate read, propose, and execute paths |
| Signer boundary | Read private key only from environment |
| `AgentPolicyVault` | Enforce spending limits on-chain |
| `SettlementRegistry` | Anchor immutable receipt hashes |
| Journal | Preserve local action history |

Execution safety properties:

- `propose` does not sign.
- `execute` requires an explicit mode.
- Payment `execute` requires `PHAROS_VAULT_ADDRESS`.
- Batch execution always goes through `AgentPolicyVault`.
- Vault policies bind asset, optional counterparty, per-transaction limit, total limit, and validity window.
- The vault rejects replayed `actionId` values.
- The vault can be paused by the owner.
- x402 execution requires a maximum amount cap.
- Private keys are never accepted through JSON input.

## Installation

Requirements:

- Node.js `>=20`.
- npm.
- Foundry for contract tests and deployment.

```bash
git clone https://github.com/TS-mfon/pharos-agent-settlement.git
cd pharos-agent-settlement
npm install
npm run build
```

Run the full local suite:

```bash
npm run check
```

This runs:

- TypeScript compilation.
- Vitest unit tests.
- Foundry contract tests.

## Configuration

Create `.env` from the example:

```bash
cp .env.example .env
```

Environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `PHAROS_RPC_URL` | No | Single Atlantic RPC URL |
| `PHAROS_RPC_URLS` | No | Comma-separated fallback RPC URLs |
| `PHAROS_MAINNET_RPC_URL` | No | Single mainnet RPC URL |
| `PHAROS_MAINNET_RPC_URLS` | No | Comma-separated mainnet fallback RPC URLs |
| `PHAROS_PRIVATE_KEY` | Execute only | Agent or owner signer private key |
| `PHAROS_VAULT_ADDRESS` | Payment execute, batch, policy admin | Deployed `AgentPolicyVault` |
| `PHAROS_ESCROW_ADDRESS` | Escrow commands | Deployed `AgentEscrow` |
| `PHAROS_REGISTRY_ADDRESS` | Receipt anchoring | Deployed `SettlementRegistry` |
| `PHAROS_X402_MAX_AMOUNT` | x402 buy | Maximum atomic-token spend for one paid API request |
| `PHAROS_JOURNAL_PATH` | No | Local reconciliation journal path |

Never commit `.env`, private keys, funded wallet mnemonics, or deployment credentials.

## CLI Reference

The binary is exposed as `pharos-settlement` after build/install. During development, use `npm run dev --`.

```bash
npm run dev -- --help
node dist/cli.js --help
```

### Inspect

```bash
node dist/cli.js inspect \
  --address 0x0000000000000000000000000000000000000001 \
  --token 0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B
```

Returns address balance, contract status, block number, token metadata, token balance, and authorization capability.

### Check Policy

```bash
node dist/cli.js policy-check \
  --request examples/payment-request.json \
  --policy examples/policy.json
```

Example result:

```json
{
  "allowed": true,
  "reasons": [],
  "remaining": "50000000"
}
```

### Propose Payment

```bash
node dist/cli.js payment \
  --request examples/payment-request.json \
  --policy examples/policy.json
```

The result includes an `actionId`, policy decision, chain ID, target contract, calldata, and value. No signature is produced in proposal mode.

### Administer Policy

```bash
PHAROS_VAULT_ADDRESS=0x... node dist/cli.js policy-admin \
  --input examples/policy-set.json \
  --mode propose
```

Use `--mode execute` only with an owner signer configured in `PHAROS_PRIVATE_KEY`.

### Batch Payment

```bash
PHAROS_VAULT_ADDRESS=0x... node dist/cli.js batch-payment \
  --input examples/batch-payments.json \
  --mode propose
```

Batch payments encode `executeBatchPayments` on the vault. The vault enforces all policy checks at execution time.

### Invoice

```bash
node dist/cli.js invoice-create --input examples/invoice.json
PHAROS_PRIVATE_KEY=0x... node dist/cli.js invoice-sign --input examples/invoice.json
node dist/cli.js invoice-verify --input signed-invoice.json --signature 0x... --signer 0x...
```

`invoice-create` produces a deterministic `invoiceId` and digest. `invoice-sign` signs the digest with `PHAROS_PRIVATE_KEY`.

### Escrow

```bash
PHAROS_ESCROW_ADDRESS=0x... node dist/cli.js escrow \
  --input examples/escrow-create.json \
  --mode propose
```

Other escrow operations use the same command with `operation` set to `fund`, `submit`, `release`, `refund`, or `dispute`.

### x402

```bash
node dist/cli.js x402-inspect --url https://example.com/paid-data
PHAROS_PRIVATE_KEY=0x... PHAROS_X402_MAX_AMOUNT=1000000 node dist/cli.js x402-buy --url https://example.com/paid-data
```

The buy path rejects unsupported networks, wrong assets, and prices above `PHAROS_X402_MAX_AMOUNT`.

### Proofs

```bash
node dist/cli.js proof-create --address 0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B
node dist/cli.js proof-verify --input proof.json
```

### Receipt Anchoring

```bash
PHAROS_REGISTRY_ADDRESS=0x... node dist/cli.js receipt-anchor \
  --input examples/receipt.json \
  --mode propose
```

### Reconciliation

```bash
node dist/cli.js reconcile
```

Reads the append-only JSONL journal and returns prior action results.

## JSON Interfaces

### Action Request

```ts
type ActionRequest = {
  actionId?: `0x${string}`;
  mode: "read" | "propose" | "execute";
  actor?: `0x${string}`;
  network: "atlantic" | "mainnet";
  action: "payment" | "batch-payment" | "invoice" | "escrow" | "x402" | "proof" | "reconcile";
  asset?: `0x${string}`;
  amount?: string;
  counterparty?: `0x${string}`;
  deadline?: number;
  metadataHash?: `0x${string}`;
  policyRef?: string;
};
```

Example:

```json
{
  "mode": "propose",
  "network": "atlantic",
  "action": "payment",
  "asset": "0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B",
  "amount": "1000000",
  "counterparty": "0x0000000000000000000000000000000000000001",
  "policyRef": "research-agent"
}
```

### Policy

```ts
type Policy = {
  id: string;
  active: boolean;
  mode: "read" | "propose" | "execute";
  asset?: `0x${string}`;
  counterparty?: `0x${string}`;
  perTransactionLimit: string;
  totalLimit: string;
  spent: string;
  validAfter: number;
  validUntil: number;
};
```

### Invoice

```ts
type Invoice = {
  invoiceId: `0x${string}`;
  recipient: `0x${string}`;
  asset?: `0x${string}`;
  amount: string;
  deadline: number;
  purpose: string;
  metadataHash: `0x${string}`;
};
```

### Action Result

```ts
type ActionResult = {
  actionId: `0x${string}`;
  status: "read" | "proposed" | "submitted" | "confirmed" | "rejected" | "failed";
  policyDecision?: {
    allowed: boolean;
    reasons: string[];
    remaining: string;
  };
  simulation?: unknown;
  estimatedCost?: string;
  transactionHashes?: `0x${string}`[];
  settlementReceipt?: unknown;
  proof?: unknown;
  data?: unknown;
  errors?: string[];
};
```

## Smart Contracts

The contracts are intentionally small and composable. They are not upgradeable by default.

### AgentPolicyVault

`contracts/src/AgentPolicyVault.sol`

Purpose: Hold funds and allow agents to execute payments only inside owner-defined policy bounds.

State:

- `owner`.
- `paused`.
- `policies[agent]`.
- `executedActions[actionId]`.

Policy fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `active` | `bool` | Enables or disables policy |
| `asset` | `address` | Required payment asset, `address(0)` for native token |
| `counterparty` | `address` | Optional fixed recipient, `address(0)` allows any recipient |
| `perTransactionLimit` | `uint128` | Maximum amount per payment |
| `totalLimit` | `uint128` | Maximum cumulative spend |
| `spent` | `uint128` | Cumulative spend used |
| `validAfter` | `uint48` | Earliest valid timestamp |
| `validUntil` | `uint48` | Expiry timestamp |

Important functions:

```solidity
function setPolicy(address agent, Policy calldata policy) external;
function revokePolicy(address agent) external;
function setPaused(bool value) external;
function executePayment(bytes32 actionId, address asset, address payable counterparty, uint128 amount) external;
function executeBatchPayments(bytes32[] calldata actionIds, address[] calldata assets, address payable[] calldata counterparties, uint128[] calldata amounts) external;
function withdraw(address asset, address payable recipient, uint256 amount) external;
```

Security behavior:

- Only `owner` can set, revoke, pause, withdraw, or transfer ownership.
- `msg.sender` is the policy-bound agent during execution.
- `actionId` replay is rejected.
- `spent` increments before transfer.
- Batch execution applies the same checks to each item.

### AgentEscrow

`contracts/src/AgentEscrow.sol`

Purpose: Manage service escrow between a payer and payee, with optional arbiter resolution.

Statuses:

- `Open`.
- `Funded`.
- `Submitted`.
- `Released`.
- `Refunded`.
- `Disputed`.

Important functions:

```solidity
function create(address payable payee, address arbiter, address asset, uint128 amount, uint48 deadline) external returns (uint256 id);
function fund(uint256 id) external payable;
function submitEvidence(uint256 id, bytes32 evidenceHash) external;
function release(uint256 id) external;
function refund(uint256 id) external;
function dispute(uint256 id) external;
```

Escrow resolution:

- Payer funds escrow.
- Payee submits evidence hash.
- Payer or arbiter releases.
- Payee, arbiter, or expired payer refund path can refund.
- Payer or payee can dispute if an arbiter exists.

### SettlementRegistry

`contracts/src/SettlementRegistry.sol`

Purpose: Anchor immutable receipt hashes for off-chain or cross-agent audit systems.

```solidity
function record(bytes32 actionId, bytes32 intentHash, bytes32 resultHash) external;
```

Once a receipt exists for an `actionId`, it cannot be overwritten.

## x402 Paid API Flow

```text
Agent
  |
  v
x402-inspect endpoint
  |
  v
HTTP 402 requirements
  |
  v
Policy filter: network, asset, max amount
  |
  v
@x402/fetch + @x402/evm
  |
  v
Payment-enabled retry
  |
  v
Protected response + payment response header
```

The x402 code path uses:

- `x402Client`.
- `wrapFetchWithPayment`.
- `ExactEvmScheme`.
- `toClientEvmSigner`.
- Pharos Atlantic network identifier `eip155:688689`.

The runtime selects only requirements matching Atlantic and the configured Atlantic USDC address.

## Proof and Receipt Model

There are two complementary evidence layers:

### Local Journal

The runtime appends action results to `settlement-journal.jsonl`.

This is fast and useful for local recovery, but it is not globally immutable.

### Settlement Registry

`SettlementRegistry` anchors `intentHash` and `resultHash` on-chain.

This creates a public, immutable reference for:

- Agent action intent.
- Result payload.
- Settlement metadata.
- External evidence stored in IPFS, Arweave, a database, or another DA layer.

### Pharos Proof Package

`proof-create` packages `eth_getProof` results with block metadata. This allows downstream verifiers to bind a receipt or balance claim to a Pharos state root.

Current implementation verifies package integrity. Full local verification of Pharos' SHA-256 hexary trie is not implemented yet.

## Agent Skill Integration

The reusable skill lives in `skill/`.

```text
skill/
├── SKILL.md
├── agents/openai.yaml
├── references/actions.md
├── references/pharos.md
├── references/security.md
└── scripts/validate-network.sh
```

To use it in an agent runtime, install or copy the `skill/` folder into that runtime's skill directory and make `pharos-settlement` available in `PATH`.

The skill tells agents to:

1. Inspect addresses and tokens first.
2. Default writes to `propose`.
3. Require explicit policy files before execution.
4. Never put keys in prompts or JSON files.
5. Reconcile after settlement.
6. Create proof packages where settlement evidence matters.

## Deployment Runbook

### 1. Install Dependencies

```bash
npm install
forge install foundry-rs/forge-std
```

### 2. Build and Test

```bash
npm run check
./skill/scripts/validate-network.sh
```

### 3. Prepare Deployer

Set a funded Atlantic deployer key in your shell. Do not commit it.

```bash
export PHAROS_RPC_URL=https://atlantic.dplabs-internal.com
export OWNER_ADDRESS=0xYourOwnerAddress
export PRIVATE_KEY=0xYourFundedPrivateKey
```

### 4. Deploy Contracts

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$PHAROS_RPC_URL" \
  --broadcast
```

### 5. Configure Runtime

```bash
export PHAROS_VAULT_ADDRESS=0xDeployedVault
export PHAROS_ESCROW_ADDRESS=0xDeployedEscrow
export PHAROS_REGISTRY_ADDRESS=0xDeployedRegistry
export PHAROS_X402_MAX_AMOUNT=1000000
```

### 6. Set Agent Policy

```bash
node dist/cli.js policy-admin \
  --input examples/policy-set.json \
  --mode propose
```

Review the calldata. Then execute with the owner signer:

```bash
PHAROS_PRIVATE_KEY=0xOwnerKey node dist/cli.js policy-admin \
  --input examples/policy-set.json \
  --mode execute
```

### 7. Fund Vault

Transfer PHRS or ERC-20 assets to `PHAROS_VAULT_ADDRESS`.

For ERC-20 payments, the vault must hold the token balance because it calls `transfer` directly during execution.

## Testing and Verification

### Unit Tests

```bash
npm test
```

Coverage includes:

- Policy decisions.
- Invoice deterministic IDs and signatures.
- Proof package integrity.
- Journal BigInt serialization.

### Contract Tests

```bash
cd contracts
forge test
```

Coverage includes:

- Policy payment execution.
- Replay protection.
- Limit violations.
- Counterparty violations.
- Batch spend accumulation.
- Escrow lifecycle.
- Registry immutability.

### Full Check

```bash
npm run check
```

### Skill Validation

```bash
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py skill
```

### Live Network Validation

```bash
./skill/scripts/validate-network.sh
```

Expected result:

```text
"USDC"
Atlantic network validated at chain ID 688689
```

## Demo Scenarios

### Research Agent Buys Data and Pays a Provider

1. Agent inspects the USDC token and provider address.
2. Agent calls `x402-inspect` on a paid research endpoint.
3. Agent calls `x402-buy` with `PHAROS_X402_MAX_AMOUNT`.
4. Agent creates a signed invoice for downstream reimbursement.
5. Agent proposes a USDC payment through `payment`.
6. Agent anchors a receipt with `receipt-anchor`.
7. Agent creates a proof package for audit.

### Service Agent Uses Escrow

1. Buyer agent creates escrow with payee, arbiter, asset, amount, and deadline.
2. Buyer funds escrow.
3. Provider submits `evidenceHash`.
4. Buyer or arbiter releases funds.
5. Receipt is anchored in `SettlementRegistry`.

### Payroll Agent Batches Settlements

1. Owner deploys and funds `AgentPolicyVault`.
2. Owner sets policy for payroll agent.
3. Payroll agent creates a batch payment JSON.
4. CLI proposes `executeBatchPayments`.
5. Agent executes within policy limits.
6. Journal and registry provide audit trail.

### Agent Marketplace Settlement Primitive

1. Agents publish service invoices.
2. Buyers escrow payment.
3. Completion evidence hashes are submitted.
4. Arbiters resolve disputes.
5. Receipts and proofs make settlement outcomes composable for reputation systems.

## CI

GitHub Actions runs two jobs:

- `sdk`: npm install, TypeScript build, Vitest.
- `contracts`: Foundry tests with recursive submodules.

Workflow file: `.github/workflows/ci.yml`.

## Known Boundaries

- Contracts are not upgradeable.
- Full local Pharos SHA-256 hexary-trie verification is not implemented.
- `x402-buy` depends on endpoint support for `eip155:688689` and a compatible facilitator.
- No hosted backend is included; this is a reusable skill/runtime package.
- ERC-4337 EntryPoint is documented in network config, but no bundler integration is implemented.
- MultiCall3 is documented as a Pharos network primitive, but batch payments intentionally execute through `AgentPolicyVault` so policy enforcement cannot be bypassed.
- Contract deployment requires a funded Atlantic key and was not embedded in the repository.

## Why This Fits the Skill-to-Agent Cascade

This project is intentionally a skill module first:

- It exposes reusable commands rather than a single agent persona.
- It covers broad economic utilities: budgets, payments, escrow, invoices, paid APIs, receipts, proofs, and reconciliation.
- It integrates concrete Pharos network capabilities.
- It gives Phase 2 agents a settlement layer they can call without redesigning payment safety.
- It is composable across commerce, research, payroll, marketplace, treasury, and service-delivery agents.

## License

MIT.
