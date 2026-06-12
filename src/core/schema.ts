import { z } from "zod";

export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export const hashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
export const modeSchema = z.enum(["read", "propose", "execute"]);
export const actionSchema = z.enum(["payment", "batch-payment", "invoice", "escrow", "x402", "proof", "reconcile"]);

export const actionRequestSchema = z.object({
  actionId: hashSchema.optional(),
  mode: modeSchema.default("propose"),
  actor: addressSchema.optional(),
  network: z.enum(["atlantic", "mainnet"]).default("atlantic"),
  action: actionSchema,
  asset: addressSchema.optional(),
  amount: z.string().regex(/^\d+$/).optional(),
  counterparty: addressSchema.optional(),
  deadline: z.number().int().positive().optional(),
  metadataHash: hashSchema.optional(),
  policyRef: z.string().optional(),
});

export const policySchema = z.object({
  id: z.string().min(1),
  active: z.boolean().default(true),
  mode: modeSchema.default("propose"),
  asset: addressSchema.optional(),
  counterparty: addressSchema.optional(),
  perTransactionLimit: z.string().regex(/^\d+$/),
  totalLimit: z.string().regex(/^\d+$/),
  spent: z.string().regex(/^\d+$/).default("0"),
  validAfter: z.number().int().nonnegative().default(0),
  validUntil: z.number().int().positive(),
});

export const invoiceSchema = z.object({
  invoiceId: hashSchema,
  recipient: addressSchema,
  asset: addressSchema.optional(),
  amount: z.string().regex(/^\d+$/),
  deadline: z.number().int().positive(),
  purpose: z.string().min(1).max(500),
  metadataHash: hashSchema,
});

export type ActionRequest = z.infer<typeof actionRequestSchema>;
export type Policy = z.infer<typeof policySchema>;
export type Invoice = z.infer<typeof invoiceSchema>;

export interface PolicyDecision {
  allowed: boolean;
  reasons: string[];
  remaining: string;
}

export interface ActionResult {
  actionId: `0x${string}`;
  status: "read" | "proposed" | "submitted" | "confirmed" | "rejected" | "failed";
  policyDecision?: PolicyDecision;
  simulation?: unknown;
  estimatedCost?: string;
  transactionHashes?: `0x${string}`[];
  settlementReceipt?: unknown;
  proof?: unknown;
  data?: unknown;
  errors?: string[];
}
