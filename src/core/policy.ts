import type { ActionRequest, Policy, PolicyDecision } from "./schema.js";

export function evaluatePolicy(request: ActionRequest, policy: Policy, now = Math.floor(Date.now() / 1000)): PolicyDecision {
  const reasons: string[] = [];
  const amount = BigInt(request.amount || "0");
  const spent = BigInt(policy.spent);
  const total = BigInt(policy.totalLimit);

  if (!policy.active) reasons.push("policy is inactive");
  if (now < policy.validAfter || now > policy.validUntil) reasons.push("policy is outside its validity window");
  if (policy.asset && request.asset?.toLowerCase() !== policy.asset.toLowerCase()) reasons.push("asset is not allowed");
  if (policy.counterparty && request.counterparty?.toLowerCase() !== policy.counterparty.toLowerCase()) reasons.push("counterparty is not allowed");
  if (amount > BigInt(policy.perTransactionLimit)) reasons.push("per-transaction limit exceeded");
  if (spent + amount > total) reasons.push("total limit exceeded");
  if (request.mode === "execute" && policy.mode !== "execute") reasons.push("policy does not permit automatic execution");

  return { allowed: reasons.length === 0, reasons, remaining: (total > spent ? total - spent : 0n).toString() };
}
