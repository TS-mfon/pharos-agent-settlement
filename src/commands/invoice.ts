import { hashTypedData, keccak256, recoverMessageAddress, toBytes, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { invoiceSchema, type Invoice } from "../core/schema.js";

export function createInvoice(input: Omit<Invoice, "invoiceId">): Invoice {
  const normalized = invoiceSchema.omit({ invoiceId: true }).parse(input);
  return { ...normalized, invoiceId: keccak256(toBytes(JSON.stringify(normalized))) };
}

export function invoiceDigest(invoice: Invoice, chainId = 688689): `0x${string}` {
  const parsed = invoiceSchema.parse(invoice);
  return hashTypedData({
    domain: { name: "Pharos Agent Settlement", version: "1", chainId },
    primaryType: "Invoice",
    types: { Invoice: [
      { name: "invoiceId", type: "bytes32" }, { name: "recipient", type: "address" }, { name: "asset", type: "address" },
      { name: "amount", type: "uint256" }, { name: "deadline", type: "uint256" }, { name: "metadataHash", type: "bytes32" },
    ] },
    message: {
      invoiceId: parsed.invoiceId as `0x${string}`,
      recipient: parsed.recipient as Address,
      asset: (parsed.asset || "0x0000000000000000000000000000000000000000") as Address,
      amount: BigInt(parsed.amount),
      deadline: BigInt(parsed.deadline),
      metadataHash: parsed.metadataHash as `0x${string}`,
    },
  });
}

export async function signInvoice(invoice: Invoice) {
  const key = process.env.PHAROS_PRIVATE_KEY;
  if (!key || !/^0x[a-fA-F0-9]{64}$/.test(key)) throw new Error("PHAROS_PRIVATE_KEY is required to sign an invoice");
  const account = privateKeyToAccount(key as `0x${string}`);
  const digest = invoiceDigest(invoice);
  return { invoice, digest, signer: account.address, signature: await account.signMessage({ message: { raw: digest } }) };
}

export async function verifyInvoiceSignature(invoice: Invoice, signature: `0x${string}`, expectedSigner: Address) {
  return (await recoverMessageAddress({ message: { raw: invoiceDigest(invoice) }, signature })).toLowerCase() === expectedSigner.toLowerCase();
}
