import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "../src/core/policy.js";

const now = 1_800_000_000;
const basePolicy = {
  id: "research-agent",
  active: true,
  mode: "execute" as const,
  perTransactionLimit: "100",
  totalLimit: "500",
  spent: "200",
  validAfter: now - 10,
  validUntil: now + 10,
};

describe("evaluatePolicy", () => {
  it("allows a bounded payment", () => {
    expect(evaluatePolicy({ mode: "execute", network: "atlantic", action: "payment", amount: "50" }, basePolicy, now)).toEqual({
      allowed: true, reasons: [], remaining: "300",
    });
  });

  it("rejects per-transaction and total limit violations", () => {
    const result = evaluatePolicy({ mode: "execute", network: "atlantic", action: "payment", amount: "400" }, basePolicy, now);
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("per-transaction limit exceeded");
    expect(result.reasons).toContain("total limit exceeded");
  });
});
