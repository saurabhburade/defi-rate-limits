"use client";

import { getRainbowKitTheme, wagmiConfig } from "@/configs/wagmi/config";
import { useIsMounted } from "@/hooks/useIsMounted";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { WagmiProvider } from "wagmi";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

const getQueryClient = () => {
  if (typeof window === "undefined") return createQueryClient();

  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
};

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const mounted = useIsMounted();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={getRainbowKitTheme({ isDarkMode, mounted })}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
