# Action Reference

All amounts use the asset's smallest unit. Every command emits JSON.

## Payment request

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

## Execution policy

```json
{
  "id": "research-agent",
  "active": true,
  "mode": "execute",
  "asset": "0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B",
  "perTransactionLimit": "5000000",
  "totalLimit": "50000000",
  "spent": "0",
  "validAfter": 0,
  "validUntil": 1900000000
}
```

Use `policy-check` to evaluate locally. Use `policy-admin` with `{"operation":"set","agent":"0x...","policy":{...}}`, `{"operation":"revoke","agent":"0x..."}`, or `{"operation":"pause","value":true}` to propose or execute vault administration.

## Escrow actions

Create: `{"operation":"create","payee":"0x...","arbiter":"0x...","asset":"0x...","amount":"1000000","deadline":1900000000}`

Fund: `{"operation":"fund","id":"1"}`. For native escrow, include `"value"`.

Submit: `{"operation":"submit","id":"1","evidenceHash":"0x..."}`

Resolve: `{"operation":"release","id":"1"}`, `refund`, or `dispute`.

## Batch payment

The batch command requires `PHAROS_VAULT_ADDRESS`. Every item is checked by the vault against the calling agent's on-chain policy.

```json
[
  {"asset":"0x...","recipient":"0x...","amount":"1000000"},
  {"asset":"0x...","recipient":"0x...","amount":"2000000"}
]
```
