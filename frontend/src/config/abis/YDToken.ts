export const YDTokenABI = [
  // Read functions
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "owner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "paused", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "EXCHANGE_RATE", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "INITIAL_SUPPLY", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "maxPurchaseLimit", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "minPurchaseLimit", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getTokenAmount", inputs: [{ name: "ethAmount", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "pure" },
  { type: "function", name: "getETHAmount", inputs: [{ name: "tokenAmount", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "pure" },

  // Write functions
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "transfer", inputs: [{ name: "to", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "transferFrom", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "buyYDToken", inputs: [], outputs: [], stateMutability: "payable" },
  { type: "function", name: "sellYDToken", inputs: [{ name: "tokenAmount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "burn", inputs: [{ name: "value", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "burnFrom", inputs: [{ name: "account", type: "address" }, { name: "value", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  // Owner functions
  { type: "function", name: "withdrawETH", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setPurchaseLimits", inputs: [{ name: "_minLimit", type: "uint256" }, { name: "_maxLimit", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "pause", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unpause", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "renounceOwnership", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "transferOwnership", inputs: [{ name: "newOwner", type: "address" }], outputs: [], stateMutability: "nonpayable" },

  // Events
  { type: "event", name: "Transfer", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
  { type: "event", name: "Approval", inputs: [{ name: "owner", type: "address", indexed: true }, { name: "spender", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
  { type: "event", name: "YDTokenPurchased", inputs: [{ name: "buyer", type: "address", indexed: true }, { name: "ethAmount", type: "uint256", indexed: false }, { name: "tokenAmount", type: "uint256", indexed: false }] },
  { type: "event", name: "YDTokenSold", inputs: [{ name: "seller", type: "address", indexed: true }, { name: "ethAmount", type: "uint256", indexed: false }, { name: "tokenAmount", type: "uint256", indexed: false }] },
  { type: "event", name: "PurchaseLimitUpdated", inputs: [{ name: "minLimit", type: "uint256", indexed: false }, { name: "maxLimit", type: "uint256", indexed: false }] },
  { type: "event", name: "Paused", inputs: [{ name: "account", type: "address", indexed: false }] },
  { type: "event", name: "Unpaused", inputs: [{ name: "account", type: "address", indexed: false }] },
  { type: "event", name: "OwnershipTransferred", inputs: [{ name: "previousOwner", type: "address", indexed: true }, { name: "newOwner", type: "address", indexed: true }] },
] as const;
