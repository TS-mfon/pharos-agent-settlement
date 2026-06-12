#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { Command } from "commander";
import { administerPolicy, anchorReceipt, batchPayment, buyX402, checkPolicy, createInvoice, createProof, escrow, inspect, inspectX402, invoiceDigest, payment, readJournal, signInvoice, verifyInvoiceSignature, verifyProofPackage } from "./index.js";

const program = new Command().name("pharos-settlement").description("Reusable settlement control plane for agents on Pharos").version("0.1.0");
const json = async (path: string) => JSON.parse(await readFile(path, "utf8"));
const output = (value: unknown) => console.log(JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2));

program.command("inspect").requiredOption("--address <address>").option("--token <address>").action(async ({ address, token }) => output(await inspect(address, token)));
program.command("payment").requiredOption("--request <file>").option("--policy <file>").action(async ({ request, policy }) => output(await payment(await json(request), policy ? await json(policy) : undefined)));
program.command("policy-check").requiredOption("--request <file>").requiredOption("--policy <file>").action(async ({ request, policy }) => output(checkPolicy(await json(request), await json(policy))));
program.command("policy-admin").requiredOption("--input <file>").option("--mode <mode>", "propose or execute", "propose").action(async ({ input, mode }) => output(await administerPolicy(await json(input), mode)));
program.command("batch-payment").requiredOption("--input <file>").option("--mode <mode>", "propose or execute", "propose").action(async ({ input, mode }) => output(await batchPayment(await json(input), mode)));
program.command("invoice-create").requiredOption("--input <file>").action(async ({ input }) => { const invoice = createInvoice(await json(input)); output({ invoice, digest: invoiceDigest(invoice) }); });
program.command("invoice-sign").requiredOption("--input <file>").action(async ({ input }) => output(await signInvoice(await json(input))));
program.command("invoice-verify").requiredOption("--input <file>").requiredOption("--signature <signature>").requiredOption("--signer <address>").action(async ({ input, signature, signer }) => output({ valid: await verifyInvoiceSignature(await json(input), signature, signer) }));
program.command("escrow").requiredOption("--input <file>").option("--mode <mode>", "propose or execute", "propose").action(async ({ input, mode }) => output(await escrow(await json(input), mode)));
program.command("x402-inspect").requiredOption("--url <url>").action(async ({ url }) => output(await inspectX402(url)));
program.command("x402-buy").requiredOption("--url <url>").action(async ({ url }) => output(await buyX402(url)));
program.command("proof-create").requiredOption("--address <address>").action(async ({ address }) => output(await createProof(address)));
program.command("proof-verify").requiredOption("--input <file>").action(async ({ input }) => output({ valid: verifyProofPackage(await json(input)) }));
program.command("receipt-anchor").requiredOption("--input <file>").option("--mode <mode>", "propose or execute", "propose").action(async ({ input, mode }) => output(await anchorReceipt(await json(input), mode)));
program.command("reconcile").action(async () => output(await readJournal()));

program.parseAsync().catch((error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
});
