"use client";

import { secondaryIconButtonClassName } from "@/components/common/Button";
import { useIsMounted } from "@/hooks/useIsMounted";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export const SwitchTheme = ({ className = "" }: { className?: string }) => {
  const { setTheme, theme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) return null;

  const dark = theme === "dark";
  const Icon = dark ? MoonIcon : SunIcon;
  const buttonClassName = [secondaryIconButtonClassName, className].filter(Boolean).join(" ");

  return (
    <button
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={buttonClassName}
      onClick={() => setTheme(dark ? "light" : "dark")}
      title={dark ? "Dark theme" : "Light theme"}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
    </button>
  );
};
