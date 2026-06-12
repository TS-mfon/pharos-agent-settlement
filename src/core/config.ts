import { defineChain, getAddress, type Address } from "viem";

export function rpcUrls(network: "atlantic" | "mainnet"): string[] {
  const configured = process.env[network === "atlantic" ? "PHAROS_RPC_URLS" : "PHAROS_MAINNET_RPC_URLS"]
    ?.split(",").map((url) => url.trim()).filter(Boolean);
  if (configured?.length) return configured;
  return [network === "atlantic"
    ? process.env.PHAROS_RPC_URL || "https://atlantic.dplabs-internal.com"
    : process.env.PHAROS_MAINNET_RPC_URL || "https://rpc.pharos.xyz"];
}

export const networks = {
  atlantic: defineChain({
    id: 688689,
    name: "Pharos Atlantic Testnet",
    nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
    rpcUrls: { default: { http: rpcUrls("atlantic") } },
    blockExplorers: { default: { name: "PharosScan", url: "https://atlantic.pharosscan.xyz" } },
  }),
  mainnet: defineChain({
    id: 1672,
    name: "Pharos Mainnet",
    nativeCurrency: { name: "Pharos", symbol: "PROS", decimals: 18 },
    rpcUrls: { default: { http: rpcUrls("mainnet") } },
    blockExplorers: { default: { name: "PharosScan", url: "https://www.pharosscan.xyz" } },
  }),
} as const;

export const atlanticContracts = {
  usdc: getAddress("0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B"),
  legacyUsdc: getAddress("0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8"),
  permit2: getAddress("0x000000000022D473030F116dDEE9F6B43aC78BA3"),
  entryPoint: getAddress("0x0000000071727De22E5E9d8BAf0edAc6f37da032"),
  multicall3: getAddress("0xcA11bde05977b3631167028862bE2a173976CA11"),
} satisfies Record<string, Address>;

export function configuredAddress(name: "vault" | "escrow" | "registry"): Address {
  const key = `PHAROS_${name.toUpperCase()}_ADDRESS`;
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return getAddress(value);
}
