import { encodeFunctionData, getAddress, keccak256, toBytes, zeroAddress, type Address } from "viem";
import { configuredAddress, networks } from "../core/config.js";
import { publicClient, walletClient } from "../core/client.js";
import { evaluatePolicy } from "../core/policy.js";
import { actionRequestSchema, policySchema, type ActionResult } from "../core/schema.js";
import { recordResult } from "../core/journal.js";
import { erc20Abi, vaultAbi } from "../contracts/abis.js";

export async function payment(rawRequest: unknown, rawPolicy?: unknown): Promise<ActionResult> {
  const request = actionRequestSchema.parse(rawRequest);
  const actionId = (request.actionId || keccak256(toBytes(JSON.stringify(request)))) as `0x${string}`;
  const result: ActionResult = { actionId, status: "proposed" };
  if (!request.counterparty || !request.amount) throw new Error("counterparty and amount are required");

  if (rawPolicy) {
    result.policyDecision = evaluatePolicy(request, policySchema.parse(rawPolicy));
    if (!result.policyDecision.allowed) {
      result.status = "rejected";
      await recordResult(result);
      return result;
    }
  } else if (request.mode === "execute") {
    throw new Error("execute mode requires a policy");
  }

  const client = publicClient(request.network);
  const account = request.actor ? getAddress(request.actor) : undefined;
  const asset = request.asset ? getAddress(request.asset) : zeroAddress;
  const counterparty = getAddress(request.counterparty);
  const amount = BigInt(request.amount);
  const vault = process.env.PHAROS_VAULT_ADDRESS ? configuredAddress("vault") : undefined;
  if (request.mode === "execute" && !vault) {
    throw new Error("execute mode requires PHAROS_VAULT_ADDRESS; direct signer transfers are proposal-only");
  }

  const transaction = vault
    ? { to: vault, data: encodeFunctionData({ abi: vaultAbi, functionName: "executePayment", args: [actionId, asset, counterparty, amount] }), value: 0n }
    : asset === zeroAddress
      ? { to: counterparty, data: "0x" as const, value: amount }
      : { to: asset, data: encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [counterparty, amount] }), value: 0n };

  if (account) {
    const gas = await client.estimateGas({ account, ...transaction });
    result.estimatedCost = ((gas * 120n) / 100n).toString();
  }
  result.simulation = { chainId: networks[request.network].id, transaction };

  if (request.mode === "execute") {
    const wallet = walletClient(request.network);
    const hash = await wallet.sendTransaction({ account: wallet.account!, chain: networks[request.network], ...transaction });
    result.status = "submitted";
    result.transactionHashes = [hash];
    result.settlementReceipt = await client.waitForTransactionReceipt({ hash });
    result.status = "confirmed";
  }
  await recordResult(result);
  return result;
}
