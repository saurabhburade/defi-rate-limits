import { type ContractName, contractAbis } from "@/configs/abis";
import type { Address } from "viem";

export type { ContractName } from "@/configs/abis";

export const contractAddresses: Partial<Record<number, Record<ContractName, Address>>> = {
  "11155111": {
    BucketedRateLimiter: "0x300f56c1eded92112f8666ba9ee13a3fabc169b3",
    TokenBucketRateLimiter: "0x478c1d7bd8f46bbd74e9d04aa287921bd6130d3f",
  },
};

export type Contract<TContractName extends ContractName = ContractName> = {
  address: Address;
  abi: (typeof contractAbis)[TContractName];
};

export const getContract = <TContractName extends ContractName>(
  contractName: TContractName,
  chainId: number,
): Contract<TContractName> | undefined => {
  const address = contractAddresses[chainId]?.[contractName];

  return address ? { address, abi: contractAbis[contractName] } : undefined;
};
