"use client";

import { useEffect, useState } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { WagmiProvider } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={
            mounted
              ? isDarkMode
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
                  })
              : lightTheme()
          }
        >
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="relative flex flex-1 flex-col">{children}</main>
            <Footer />
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
