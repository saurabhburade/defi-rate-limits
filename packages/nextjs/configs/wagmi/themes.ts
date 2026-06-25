import { darkTheme, lightTheme } from "@rainbow-me/rainbowkit";

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
