"use client";

import { secondaryButtonClassName } from "@/components/common/Button";

export const Footer = () => {
  return (
    <footer className="border-t border-default px-4 py-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:px-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>DeFi rate limiting proof of concept.</span>
          <span className="hidden opacity-30 lg:inline">/</span>
          <span>simulation-first workflow.</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <a
            href="https://github.com/saurabhburade/defi-rate-limits"
            target="_blank"
            rel="noreferrer"
            className={`${secondaryButtonClassName} h-8 px-3 text-xs text-muted-foreground hover:text-foreground`}
          >
            GitHub
          </a>
          <a
            href="https://x.com/saurabh_evm"
            target="_blank"
            rel="noreferrer"
            className={`${secondaryButtonClassName} h-8 px-3 text-xs text-muted-foreground hover:text-foreground`}
          >
            @saurabh_evm
          </a>
        </div>
      </div>
    </footer>
  );
};
