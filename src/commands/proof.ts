import { getAddress, keccak256, toBytes, type Address, type Hex } from "viem";
import { publicClient } from "../core/client.js";

export async function createProof(address: string, storageKeys: Hex[] = []) {
  const client = publicClient();
  const block = await client.getBlock();
  const proof = await client.request({ method: "eth_getProof", params: [getAddress(address), storageKeys, "latest"] } as any);
  return {
    version: "pharos-settlement-proof-v1",
    chainId: 688689,
    blockNumber: block.number.toString(),
    blockHash: block.hash,
    stateRoot: block.stateRoot,
    subject: getAddress(address),
    storageKeys,
    proof,
    packageHash: keccak256(toBytes(JSON.stringify(proof))),
  };
}

export function verifyProofPackage(bundle: any): boolean {
  return bundle?.version === "pharos-settlement-proof-v1"
    && /^0x[a-fA-F0-9]{64}$/.test(bundle.blockHash)
    && /^0x[a-fA-F0-9]{64}$/.test(bundle.stateRoot)
    && bundle.packageHash === keccak256(toBytes(JSON.stringify(bundle.proof)));
}
