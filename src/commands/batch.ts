import { encodeFunctionData, getAddress, keccak256, toBytes } from "viem";
import { configuredAddress, networks } from "../core/config.js";
import { publicClient, walletClient } from "../core/client.js";
import { vaultAbi } from "../contracts/abis.js";

export interface BatchPayment { asset: string; recipient: string; amount: string; allowFailure?: boolean }

export async function batchPayment(payments: BatchPayment[], mode: "propose" | "execute" = "propose") {
  if (!payments.length || payments.length > 100) throw new Error("batch must contain 1-100 payments");
  const actionIds = payments.map((payment, index) => keccak256(toBytes(JSON.stringify({ index, ...payment }))));
  const data = encodeFunctionData({ abi: vaultAbi, functionName: "executeBatchPayments", args: [
    actionIds, payments.map((item) => getAddress(item.asset)), payments.map((item) => getAddress(item.recipient)), payments.map((item) => BigInt(item.amount)),
  ] });
  const proposal = { to: configuredAddress("vault"), data, value: 0n, chainId: networks.atlantic.id };
  if (mode === "propose") return { status: "proposed", transaction: proposal, payments: payments.length };
  const wallet = walletClient();
  const hash = await wallet.sendTransaction({ account: wallet.account!, chain: networks.atlantic, to: proposal.to, data, value: 0n });
  return { status: "confirmed", hash, receipt: await publicClient().waitForTransactionReceipt({ hash }) };
}
