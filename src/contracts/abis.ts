export const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "authorizationState", stateMutability: "view", inputs: [{ type: "address" }, { type: "bytes32" }], outputs: [{ type: "bool" }] },
] as const;

export const vaultAbi = [
  { type: "function", name: "executePayment", stateMutability: "nonpayable", inputs: [{ type: "bytes32", name: "actionId" }, { type: "address", name: "asset" }, { type: "address", name: "counterparty" }, { type: "uint128", name: "amount" }], outputs: [] },
  { type: "function", name: "executeBatchPayments", stateMutability: "nonpayable", inputs: [{ type: "bytes32[]", name: "actionIds" }, { type: "address[]", name: "assets" }, { type: "address[]", name: "counterparties" }, { type: "uint128[]", name: "amounts" }], outputs: [] },
  { type: "function", name: "setPolicy", stateMutability: "nonpayable", inputs: [{ type: "address", name: "agent" }, { type: "tuple", name: "policy", components: [{ type: "bool", name: "active" }, { type: "address", name: "asset" }, { type: "address", name: "counterparty" }, { type: "uint128", name: "perTransactionLimit" }, { type: "uint128", name: "totalLimit" }, { type: "uint128", name: "spent" }, { type: "uint48", name: "validAfter" }, { type: "uint48", name: "validUntil" }] }], outputs: [] },
  { type: "function", name: "revokePolicy", stateMutability: "nonpayable", inputs: [{ type: "address", name: "agent" }], outputs: [] },
  { type: "function", name: "setPaused", stateMutability: "nonpayable", inputs: [{ type: "bool", name: "value" }], outputs: [] },
] as const;

export const registryAbi = [
  { type: "function", name: "record", stateMutability: "nonpayable", inputs: [{ type: "bytes32", name: "actionId" }, { type: "bytes32", name: "intentHash" }, { type: "bytes32", name: "resultHash" }], outputs: [] },
] as const;

export const escrowAbi = [
  { type: "function", name: "create", stateMutability: "nonpayable", inputs: [{ type: "address", name: "payee" }, { type: "address", name: "arbiter" }, { type: "address", name: "asset" }, { type: "uint128", name: "amount" }, { type: "uint48", name: "deadline" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "fund", stateMutability: "payable", inputs: [{ type: "uint256", name: "id" }], outputs: [] },
  { type: "function", name: "submitEvidence", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "id" }, { type: "bytes32", name: "evidenceHash" }], outputs: [] },
  { type: "function", name: "release", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "id" }], outputs: [] },
  { type: "function", name: "refund", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "id" }], outputs: [] },
  { type: "function", name: "dispute", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "id" }], outputs: [] },
] as const;
