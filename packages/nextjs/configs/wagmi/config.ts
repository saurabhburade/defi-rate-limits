import { APP_NAME } from "@/configs/constants";
import { darkTheme, getDefaultWallets, lightTheme } from "@rainbow-me/rainbowkit";
import { type Chain, http } from "viem";
import { sepolia } from "viem/chains";
import { createConfig } from "wagmi";

const targetNetworks = [sepolia] as const satisfies readonly [Chain, ...Chain[]];
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "YOUR_WALLET_CONNECT_PROJECT_ID";
const chainDisplayNames: Partial<Record<number, string>> = {
  [sepolia.id]: "Ethereum Sepolia",
};
const explorerUrls: Partial<Record<number, string>> = {
  [sepolia.id]: "https://sepolia.etherscan.io",
};
const connectors =
  typeof window === "undefined"
    ? []
    : getDefaultWallets({
        appName: APP_NAME,
        projectId: walletConnectProjectId,
      }).connectors;

export type TargetChainId = (typeof targetNetworks)[number]["id"];

export const getConfiguredChain = (chainId?: number) =>
  targetNetworks.find(network => network.id === chainId) ?? targetNetworks[0];

export const getChainDisplayName = (chain: Chain) => chainDisplayNames[chain.id] ?? chain.name;

export const getBlockExplorerTxUrl = (chainId: number, txHash: string) =>
  explorerUrls[chainId] ? `${explorerUrls[chainId]}/tx/${txHash}` : "";

export const getRainbowKitTheme = ({ isDarkMode, mounted }: { isDarkMode: boolean; mounted: boolean }) => {
  if (!mounted) return lightTheme();

  return isDarkMode
    ? darkTheme({
        accentColor: "#ffffff",
        accentColorForeground: "#09090b",
        borderRadius: "medium",
        overlayBlur: "small",
      })
    : lightTheme({
        accentColor: "#111111",
        accentColorForeground: "#fafafa",
        borderRadius: "medium",
        overlayBlur: "small",
      });
};

export const wagmiConfig = createConfig({
  chains: targetNetworks,
  connectors,
  ssr: true,
  transports: {
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
  },
});
