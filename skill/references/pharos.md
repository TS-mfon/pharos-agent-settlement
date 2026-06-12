# Pharos Network Reference

## Atlantic Testnet

- Chain ID: `688689`
- RPC: `https://atlantic.dplabs-internal.com`
- Explorer: `https://atlantic.pharosscan.xyz`
- Native token: `PHRS`
- Current x402-compatible USDC candidate: `0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B`
- Permit2: `0x000000000022D473030F116dDEE9F6B43aC78BA3`
- ERC-4337 EntryPoint: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`
- MultiCall3: `0xcA11bde05977b3631167028862bE2a173976CA11`

Do not trust this file alone before a write. Run `inspect` to confirm chain ID, contract code, token metadata, and authorization support.

Pharos `eth_getProof` uses a SHA-256 hexary trie rather than Ethereum's MPT. The current runtime packages RPC proofs and validates package integrity; full local trie verification is a future extension.
