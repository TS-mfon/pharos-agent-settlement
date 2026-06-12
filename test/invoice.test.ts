import { describe, expect, it } from "vitest";
import { createInvoice, invoiceDigest, signInvoice, verifyInvoiceSignature } from "../src/commands/invoice.js";

describe("invoice", () => {
  it("creates deterministic invoice IDs and typed data digests", () => {
    const input = {
      recipient: "0x0000000000000000000000000000000000000001",
      amount: "1000000",
      deadline: 1_900_000_000,
      purpose: "Pay for verified research",
      metadataHash: `0x${"11".repeat(32)}`,
    };
    const first = createInvoice(input);
    expect(createInvoice(input).invoiceId).toBe(first.invoiceId);
    expect(invoiceDigest(first)).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("signs and verifies an invoice", async () => {
    process.env.PHAROS_PRIVATE_KEY = `0x${"01".repeat(32)}`;
    const invoice = createInvoice({
      recipient: "0x0000000000000000000000000000000000000001",
      amount: "1",
      deadline: 1_900_000_000,
      purpose: "test",
      metadataHash: `0x${"11".repeat(32)}`,
    });
    const signed = await signInvoice(invoice);
    expect(await verifyInvoiceSignature(invoice, signed.signature, signed.signer)).toBe(true);
  });
});
