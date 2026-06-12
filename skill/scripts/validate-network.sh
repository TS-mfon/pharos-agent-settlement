#!/usr/bin/env bash
set -euo pipefail

RPC_URL="${PHAROS_RPC_URL:-https://atlantic.dplabs-internal.com}"
CHAIN_ID="$(cast chain-id --rpc-url "$RPC_URL")"
test "$CHAIN_ID" = "688689"
cast code 0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B --rpc-url "$RPC_URL" | grep -q '^0x..'
cast call 0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B 'symbol()(string)' --rpc-url "$RPC_URL"
printf 'Atlantic network validated at chain ID %s\n' "$CHAIN_ID"
