import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { getConfiguredChain } from "~~/config/web3";
import { type Contract, type ContractName, getContract } from "~~/contracts";

type DeployedContractResult<TContractName extends ContractName> = {
  data: Contract<TContractName> | undefined;
  isLoading: boolean;
};

export const useDeployedContract = <TContractName extends ContractName>({
  chainId,
  contractName,
}: {
  chainId?: number;
  contractName: TContractName;
}): DeployedContractResult<TContractName> => {
  const selectedChain = getConfiguredChain(chainId);
  const publicClient = usePublicClient({ chainId: selectedChain.id });
  const contract = getContract(contractName, selectedChain.id);
  const [isDeployed, setIsDeployed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkDeployment = async () => {
      setIsLoading(true);
      setIsDeployed(false);

      if (!publicClient || !contract) {
        setIsLoading(false);
        return;
      }

      try {
        const bytecode = await publicClient.getBytecode({ address: contract.address });
        if (!cancelled) {
          setIsDeployed(Boolean(bytecode && bytecode !== "0x"));
        }
      } catch (error) {
        console.error(`[${contractName}.getBytecode] failed`, error);
        if (!cancelled) {
          setIsDeployed(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    checkDeployment();

    return () => {
      cancelled = true;
    };
  }, [contract, contractName, publicClient]);

  return {
    data: isDeployed ? contract : undefined,
    isLoading,
  };
};
