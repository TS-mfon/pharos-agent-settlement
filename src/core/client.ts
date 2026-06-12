import { createPublicClient, createWalletClient, fallback, http, type Address, type Chain, type PublicClient, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { networks, rpcUrls } from "./config.js";

const transport = (network: keyof typeof networks) => fallback(rpcUrls(network).map((url) => http(url, { retryCount: 2, timeout: 15_000 })));

export function publicClient(network: keyof typeof networks = "atlantic"): PublicClient {
  const chain = networks[network] as Chain;
  return createPublicClient({ chain, transport: transport(network) });
}

export function walletClient(network: keyof typeof networks = "atlantic"): WalletClient {
  const key = process.env.PHAROS_PRIVATE_KEY;
  if (!key || !/^0x[a-fA-F0-9]{64}$/.test(key)) throw new Error("PHAROS_PRIVATE_KEY is missing or invalid");
  const chain = networks[network] as Chain;
  return createWalletClient({ account: privateKeyToAccount(key as `0x${string}`), chain, transport: transport(network) });
}

export async function inspectAddress(address: Address, network: keyof typeof networks = "atlantic") {
  const client = publicClient(network);
  const [balance, code, blockNumber] = await Promise.all([
    client.getBalance({ address }),
    client.getCode({ address }),
    client.getBlockNumber(),
  ]);
  return { address, balance: balance.toString(), isContract: Boolean(code && code !== "0x"), blockNumber: blockNumber.toString() };
}
