import { describe, expect, it } from "vitest";
import { keccak256, toBytes } from "viem";
import { verifyProofPackage } from "../src/commands/proof.js";

describe("proof package", () => {
  it("detects tampering", () => {
    const proof = { accountProof: ["0x12"] };
    const bundle = { version: "pharos-settlement-proof-v1", blockHash: `0x${"11".repeat(32)}`, stateRoot: `0x${"22".repeat(32)}`, proof, packageHash: keccak256(toBytes(JSON.stringify(proof))) };
    expect(verifyProofPackage(bundle)).toBe(true);
    expect(verifyProofPackage({ ...bundle, proof: { accountProof: [] } })).toBe(false);
  });
});
