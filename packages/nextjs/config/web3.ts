import type { Chain } from "viem";
import * as chains from "viem/chains";

export const DEFAULT_ALCHEMY_API_KEY = "cR4WnXePioePZ5fFrnSiR";

export const targetNetworks = [chains.sepolia] as const satisfies readonly [Chain, ...Chain[]];

export type TargetChain = (typeof targetNetworks)[number];
export type TargetChainId = TargetChain["id"];

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

const chainDisplayNames: Partial<Record<number, string>> = {
  [chains.sepolia.id]: "Ethereum Sepolia",
};

export const getAlchemyHttpUrl = (chainId: number) =>
  alchemyApiKey && rpcChainNames[chainId] ? `https://${rpcChainNames[chainId]}.g.alchemy.com/v2/${alchemyApiKey}` : "";

export const getConfiguredChain = (chainId?: number) =>
  targetNetworks.find(network => network.id === chainId) ?? targetNetworks[0];

export const getChainDisplayName = (chain: Chain) => chainDisplayNames[chain.id] ?? chain.name;

export const getBlockExplorerTxUrl = (chainId: number, txHash: string) => {
  const network = targetNetworks.find(targetNetwork => targetNetwork.id === chainId);
  const blockExplorerUrl = network?.blockExplorers?.default?.url;
  return blockExplorerUrl ? `${blockExplorerUrl}/tx/${txHash}` : "";
};

export const isLocalChain = (chainId: number) => chainId === chains.anvil.id;
