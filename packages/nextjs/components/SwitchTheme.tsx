"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ComputerDesktopIcon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";

const modes = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: ComputerDesktopIcon },
] as const;

export const SwitchTheme = ({ className = "" }: { className?: string }) => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`inline-flex items-center rounded-2xl border border-white/10 bg-[#101010] p-1 ${className}`}>
      {modes.map(mode => {
        const Icon = mode.icon;
        const active = theme === mode.value;

        return (
          <button
            key={mode.value}
            aria-label={mode.label}
            className={`inline-flex items-center justify-center rounded-xl p-2.5 text-xs font-medium transition ${
              active ? "bg-white text-black" : "text-white/58 hover:text-white"
            }`}
            onClick={() => setTheme(mode.value)}
            title={mode.label}
            type="button"
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
};
