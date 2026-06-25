import type { Chain } from "viem";
import * as chains from "viem/chains";

export const targetNetworks = [chains.sepolia] as const satisfies readonly [Chain, ...Chain[]];

export type TargetChain = (typeof targetNetworks)[number];
export type TargetChainId = TargetChain["id"];

const chainDisplayNames: Partial<Record<number, string>> = {
  [chains.sepolia.id]: "Ethereum Sepolia",
};

export const getConfiguredChain = (chainId?: number) =>
  targetNetworks.find(network => network.id === chainId) ?? targetNetworks[0];

export const getChainDisplayName = (chain: Chain) => chainDisplayNames[chain.id] ?? chain.name;

export const isLocalChain = (chainId: number) => chainId === chains.anvil.id;
