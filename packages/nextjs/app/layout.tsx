import { Inter } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import { AppProviders } from "~~/components/AppProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/metadata";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = getMetadata({
  title: "DeFi Rate Limit Lab",
  description: "POC comparing rolling-window and token-bucket rate limiters.",
});

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="defi-rate-limits-theme">
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
