import { targetNetworks } from "@/configs/wagmi/chains";

export const getBlockExplorerTxUrl = (chainId: number, txHash: string) => {
  const network = targetNetworks.find(targetNetwork => targetNetwork.id === chainId);
  const blockExplorerUrl = network?.blockExplorers?.default?.url;
  return blockExplorerUrl ? `${blockExplorerUrl}/tx/${txHash}` : "";
};
