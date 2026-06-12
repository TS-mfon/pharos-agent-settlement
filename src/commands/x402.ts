import { atlanticContracts } from "../core/config.js";
import { publicClient } from "../core/client.js";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";

export async function inspectX402(url: string) {
  const response = await fetch(url, { redirect: "manual" });
  const paymentRequired = response.status === 402;
  return {
    url,
    status: response.status,
    paymentRequired,
    paymentRequiredHeader: response.headers.get("payment-required"),
    xPaymentHeader: response.headers.get("x-payment"),
    expectedNetwork: "eip155:688689",
    recommendedAsset: atlanticContracts.usdc,
  };
}

export async function buyX402(url: string) {
  const key = process.env.PHAROS_PRIVATE_KEY;
  if (!key || !/^0x[a-fA-F0-9]{64}$/.test(key)) throw new Error("PHAROS_PRIVATE_KEY is required for x402 execution");
  const inspection = await inspectX402(url);
  if (!inspection.paymentRequired) throw new Error("endpoint did not return HTTP 402; refusing payment-enabled retry");
  const maxAmount = process.env.PHAROS_X402_MAX_AMOUNT;
  if (!maxAmount || !/^\d+$/.test(maxAmount)) throw new Error("PHAROS_X402_MAX_AMOUNT must be configured in atomic token units");
  const signer = toClientEvmSigner(privateKeyToAccount(key as `0x${string}`), publicClient());
  const client = new x402Client()
    .register("eip155:688689", new ExactEvmScheme(signer))
    .registerPolicy((_version, requirements) => requirements.filter((requirement) =>
      requirement.network === "eip155:688689"
      && requirement.asset.toLowerCase() === atlanticContracts.usdc.toLowerCase()
      && BigInt(requirement.amount) <= BigInt(maxAmount),
    ));
  const response = await wrapFetchWithPayment(fetch, client)(url);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();
  return {
    status: response.status,
    paymentResponse: response.headers.get("payment-response") || response.headers.get("x-payment-response"),
    body,
  };
}
