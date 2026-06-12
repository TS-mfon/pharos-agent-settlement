import { encodeFunctionData, getAddress, zeroAddress, type Hex } from "viem";
import { configuredAddress, networks } from "../core/config.js";
import { publicClient, walletClient } from "../core/client.js";
import { escrowAbi } from "../contracts/abis.js";

export type EscrowOperation =
  | { operation: "create"; payee: string; arbiter?: string; asset?: string; amount: string; deadline: number }
  | { operation: "fund"; id: string; value?: string }
  | { operation: "submit"; id: string; evidenceHash: Hex }
  | { operation: "release" | "refund" | "dispute"; id: string };

export async function escrow(raw: EscrowOperation, mode: "propose" | "execute" = "propose") {
  const contract = configuredAddress("escrow");
  let data: Hex;
  let value = 0n;
  if (raw.operation === "create") {
    data = encodeFunctionData({ abi: escrowAbi, functionName: "create", args: [getAddress(raw.payee), raw.arbiter ? getAddress(raw.arbiter) : zeroAddress, raw.asset ? getAddress(raw.asset) : zeroAddress, BigInt(raw.amount), raw.deadline] });
  } else if (raw.operation === "fund") {
    data = encodeFunctionData({ abi: escrowAbi, functionName: "fund", args: [BigInt(raw.id)] });
    value = BigInt(raw.value || "0");
  } else if (raw.operation === "submit") {
    data = encodeFunctionData({ abi: escrowAbi, functionName: "submitEvidence", args: [BigInt(raw.id), raw.evidenceHash] });
  } else {
    data = encodeFunctionData({ abi: escrowAbi, functionName: raw.operation, args: [BigInt(raw.id)] });
  }
  const proposal = { to: contract, data, value, chainId: networks.atlantic.id };
  if (mode === "propose") return { status: "proposed", transaction: proposal };
  const wallet = walletClient();
  const hash = await wallet.sendTransaction({ account: wallet.account!, chain: networks.atlantic, to: contract, data, value });
  return { status: "confirmed", hash, receipt: await publicClient().waitForTransactionReceipt({ hash }) };
}
