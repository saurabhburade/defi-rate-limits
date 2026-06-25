import * as chains from "viem/chains";

export const DEFAULT_ALCHEMY_API_KEY = "cR4WnXePioePZ5fFrnSiR";

export const pollingInterval = 3000;

export const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY;

export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64";

export const rpcOverrides: Partial<Record<number, string>> = {
  [chains.sepolia.id]:
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
    `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY}`,
};

const rpcChainNames: Record<number, string> = {
  [chains.mainnet.id]: "eth-mainnet",
  [chains.sepolia.id]: "eth-sepolia",
  [chains.optimism.id]: "opt-mainnet",
  [chains.optimismSepolia.id]: "opt-sepolia",
  [chains.arbitrum.id]: "arb-mainnet",
  [chains.arbitrumSepolia.id]: "arb-sepolia",
  [chains.polygon.id]: "polygon-mainnet",
  [chains.polygonAmoy.id]: "polygon-amoy",
  [chains.base.id]: "base-mainnet",
  [chains.baseSepolia.id]: "base-sepolia",
};

export const getAlchemyHttpUrl = (chainId: number) =>
  alchemyApiKey && rpcChainNames[chainId] ? `https://${rpcChainNames[chainId]}.g.alchemy.com/v2/${alchemyApiKey}` : "";
