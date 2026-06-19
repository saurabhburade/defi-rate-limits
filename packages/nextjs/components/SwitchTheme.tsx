"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { secondaryButtonClassName } from "~~/components/rate-limit/ui";

export const SwitchTheme = ({ className = "" }: { className?: string }) => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const dark = theme === "dark";
  const Icon = dark ? MoonIcon : SunIcon;
  const buttonClassName = [secondaryButtonClassName, "text-muted-foreground hover:text-foreground", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={buttonClassName}
      onClick={() => setTheme(dark ? "light" : "dark")}
      style={{ height: 32, padding: 0, width: 32 }}
      title={dark ? "Dark theme" : "Light theme"}
      type="button"
    >
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
    </button>
  );
};
