import { encodeFunctionData, type Hex } from "viem";
import { registryAbi } from "../contracts/abis.js";
import { publicClient, walletClient } from "../core/client.js";
import { configuredAddress, networks } from "../core/config.js";

export async function anchorReceipt(
  receipt: { actionId: Hex; intentHash: Hex; resultHash: Hex },
  mode: "propose" | "execute" = "propose",
) {
  const registry = configuredAddress("registry");
  const data = encodeFunctionData({ abi: registryAbi, functionName: "record", args: [receipt.actionId, receipt.intentHash, receipt.resultHash] });
  const proposal = { to: registry, data, chainId: networks.atlantic.id };
  if (mode === "propose") return { status: "proposed", transaction: proposal };
  const wallet = walletClient();
  const hash = await wallet.sendTransaction({ account: wallet.account!, chain: networks.atlantic, to: registry, data });
  return { status: "confirmed", hash, receipt: await publicClient().waitForTransactionReceipt({ hash }) };
}
