import type { Abi } from "viem";

export const contractAbis = {
  BucketedRateLimiter: [
    {
      type: "constructor",
      inputs: [
        {
          name: "_limit",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "fallback",
      stateMutability: "payable",
    },
    {
      type: "receive",
      stateMutability: "payable",
    },
    {
      type: "function",
      name: "borrow",
      inputs: [
        {
          name: "amount",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "bucketSize",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "currentBucketId",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "limit",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "numBuckets",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "previewBorrow",
      inputs: [
        {
          name: "amount",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "allowed",
          type: "bool",
          internalType: "bool",
        },
        {
          name: "usedBefore",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "remainingAfter",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "recentBuckets",
      inputs: [],
      outputs: [
        {
          name: "bucketIndices",
          type: "uint256[]",
          internalType: "uint256[]",
        },
        {
          name: "amounts",
          type: "uint256[]",
          internalType: "uint256[]",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "remainingCapacity",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "windowDuration",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "pure",
    },
    {
      type: "function",
      name: "windowUsage",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "event",
      name: "BorrowExecuted",
      inputs: [
        {
          name: "account",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "amount",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
        {
          name: "bucketIndex",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "windowUsageAfter",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "error",
      name: "EtherNotAccepted",
      inputs: [],
    },
    {
      type: "error",
      name: "InvalidAmount",
      inputs: [],
    },
    {
      type: "error",
      name: "InvalidConfig",
      inputs: [],
    },
    {
      type: "error",
      name: "RateLimited",
      inputs: [
        {
          name: "requested",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "available",
          type: "uint256",
          internalType: "uint256",
        },
      ],
    },
  ],
  TokenBucketRateLimiter: [
    {
      type: "constructor",
      inputs: [
        {
          name: "_maxCapacity",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_refillRate",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "fallback",
      stateMutability: "payable",
    },
    {
      type: "receive",
      stateMutability: "payable",
    },
    {
      type: "function",
      name: "availableCapacity",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "borrow",
      inputs: [
        {
          name: "amount",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "capacity",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "lastUpdate",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "maxCapacity",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "previewBorrow",
      inputs: [
        {
          name: "amount",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "allowed",
          type: "bool",
          internalType: "bool",
        },
        {
          name: "availableBefore",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "remainingAfter",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "refillRate",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "secondsUntilAvailable",
      inputs: [
        {
          name: "amount",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "secondsUntilFull",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "event",
      name: "BorrowExecuted",
      inputs: [
        {
          name: "account",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "amount",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
        {
          name: "capacityAfter",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "error",
      name: "EtherNotAccepted",
      inputs: [],
    },
    {
      type: "error",
      name: "ExceedsBurstCapacity",
      inputs: [
        {
          name: "requested",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "maxCapacity",
          type: "uint256",
          internalType: "uint256",
        },
      ],
    },
    {
      type: "error",
      name: "InvalidAmount",
      inputs: [],
    },
    {
      type: "error",
      name: "InvalidConfig",
      inputs: [],
    },
    {
      type: "error",
      name: "RateLimited",
      inputs: [
        {
          name: "requested",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "available",
          type: "uint256",
          internalType: "uint256",
        },
      ],
    },
  ],
} as const satisfies Record<string, Abi>;

export type ContractName = keyof typeof contractAbis;
