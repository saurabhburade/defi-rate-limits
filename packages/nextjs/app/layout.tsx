import { Inter } from "next/font/google";
import { AppProviders } from "@/components/layout/AppProviders";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { getMetadata } from "@/configs/metadata";
import "@/styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = getMetadata({
  title: "DeFi Rate Limit Lab",
  description: "POC comparing rolling-window and token-bucket rate limiters.",
});

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="defi-rate-limits-theme">
          <AppProviders>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="relative flex flex-1 flex-col">{children}</main>
              <Footer />
            </div>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
