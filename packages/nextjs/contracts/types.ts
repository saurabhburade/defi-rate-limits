import type { Abi, Address } from "viem";

export type InheritedFunctions = { readonly [key: string]: string };

export type ContractDeclaration = {
  address: Address;
  abi: Abi;
  inheritedFunctions?: InheritedFunctions;
  external?: true;
  deployedOnBlock?: number;
};

export type ContractsDeclaration = {
  [chainId: number]: {
    [contractName: string]: ContractDeclaration;
  };
};
