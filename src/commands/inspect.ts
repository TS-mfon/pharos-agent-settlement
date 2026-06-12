import { getAddress, zeroHash, type Address } from "viem";
import { inspectAddress, publicClient } from "../core/client.js";
import { erc20Abi } from "../contracts/abis.js";

export async function inspect(target: string, token?: string) {
  const address = getAddress(target);
  const base = await inspectAddress(address);
  if (!token) return base;
  const tokenAddress = getAddress(token);
  const client = publicClient();
  const [name, symbol, decimals, balance, authorization] = await Promise.all([
    client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "name" }),
    client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "symbol" }),
    client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }),
    client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "balanceOf", args: [address] }),
    client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "authorizationState", args: [address, zeroHash] }).then(() => true).catch(() => false),
  ]);
  return { ...base, token: { address: tokenAddress, name, symbol, decimals, balance: balance.toString(), supportsAuthorizationState: authorization } };
}
