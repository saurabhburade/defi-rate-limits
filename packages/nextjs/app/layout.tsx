import { AppProviders } from "@/components/layout/AppProviders";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { getMetadata } from "@/libs/metadata";
import "@/styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

export const metadata = getMetadata({
  title: "DeFi Rate Limit Lab",
  description: "POC comparing rolling-window and token-bucket rate limiters.",
});

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="defi-rate-limits-theme">
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
