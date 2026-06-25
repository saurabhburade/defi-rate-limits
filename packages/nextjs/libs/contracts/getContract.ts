import deployedContracts from "@/configs/contracts/deployments";
import externalContracts from "@/configs/contracts/externalContracts";
import { type TargetChainId, getConfiguredChain } from "@/configs/wagmi/chains";
import type { ContractDeclaration, ContractsDeclaration } from "@/types/contracts";

const mergeContracts = <TLocal extends ContractsDeclaration, TExternal extends ContractsDeclaration>(
  local: TLocal,
  external: TExternal,
) => {
  const result: ContractsDeclaration = {};
  const chainIds = Array.from(new Set([...Object.keys(external), ...Object.keys(local)]));

  for (const chainId of chainIds) {
    const localContracts = local[Number(chainId)] ?? {};
    const externalContractsForChain = external[Number(chainId)] ?? {};
    const externalWithFlags = Object.fromEntries(
      Object.entries(externalContractsForChain).map(([contractName, declaration]) => [
        contractName,
        { ...declaration, external: true as const },
      ]),
    );

    result[Number(chainId)] = {
      ...externalWithFlags,
      ...localContracts,
    };
  }

  return result;
};

export const contracts = mergeContracts(deployedContracts, externalContracts);

type DeployedContracts = typeof deployedContracts;
type ConfiguredContracts = DeployedContracts[TargetChainId];

export type ContractName = keyof ConfiguredContracts;
export type Contract<TContractName extends ContractName = ContractName> = ConfiguredContracts[TContractName] &
  ContractDeclaration;

export const getContract = <TContractName extends ContractName>(contractName: TContractName, chainId?: number) => {
  const selectedChain = getConfiguredChain(chainId);
  return contracts[selectedChain.id]?.[contractName as string] as Contract<TContractName> | undefined;
};
