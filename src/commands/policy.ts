import { encodeFunctionData, getAddress, zeroAddress } from "viem";
import { vaultAbi } from "../contracts/abis.js";
import { publicClient, walletClient } from "../core/client.js";
import { configuredAddress, networks } from "../core/config.js";
import { evaluatePolicy } from "../core/policy.js";
import { actionRequestSchema, policySchema } from "../core/schema.js";

export function checkPolicy(request: unknown, policy: unknown) {
  return evaluatePolicy(actionRequestSchema.parse(request), policySchema.parse(policy));
}

export async function administerPolicy(
  input: { operation: "set"; agent: string; policy: unknown } | { operation: "revoke"; agent: string } | { operation: "pause"; value: boolean },
  mode: "propose" | "execute" = "propose",
) {
  const vault = configuredAddress("vault");
  let data: `0x${string}`;
  if (input.operation === "set") {
    const policy = policySchema.parse(input.policy);
    data = encodeFunctionData({ abi: vaultAbi, functionName: "setPolicy", args: [getAddress(input.agent), {
      active: policy.active,
      asset: policy.asset ? getAddress(policy.asset) : zeroAddress,
      counterparty: policy.counterparty ? getAddress(policy.counterparty) : zeroAddress,
      perTransactionLimit: BigInt(policy.perTransactionLimit),
      totalLimit: BigInt(policy.totalLimit),
      spent: BigInt(policy.spent),
      validAfter: policy.validAfter,
      validUntil: policy.validUntil,
    }] });
  } else if (input.operation === "revoke") {
    data = encodeFunctionData({ abi: vaultAbi, functionName: "revokePolicy", args: [getAddress(input.agent)] });
  } else {
    data = encodeFunctionData({ abi: vaultAbi, functionName: "setPaused", args: [input.value] });
  }
  const proposal = { to: vault, data, chainId: networks.atlantic.id };
  if (mode === "propose") return { status: "proposed", transaction: proposal };
  const wallet = walletClient();
  const hash = await wallet.sendTransaction({ account: wallet.account!, chain: networks.atlantic, to: vault, data });
  return { status: "confirmed", hash, receipt: await publicClient().waitForTransactionReceipt({ hash }) };
}
