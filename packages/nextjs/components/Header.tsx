"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
};

const menuLinks: HeaderMenuLink[] = [
  { label: "Home", href: "/" },
  { label: "Debug", href: "/debug" },
];

const navLinkClassName =
  "rounded-xl border border-default px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-[color:var(--surface-muted)] hover:text-foreground";

const connectButtonClassName =
  "inline-flex items-center justify-center rounded-xl border border-[color:var(--primary)] bg-[color:var(--primary)] px-3 py-2 text-xs font-medium text-[color:var(--primary-foreground)] transition hover:border-[color:var(--primary-hover)] hover:bg-[color:var(--primary-hover)]";

const ConnectedWalletButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!connected) {
          return (
            <button className={connectButtonClassName} onClick={openConnectModal} type="button">
              Connect wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500/15"
              onClick={openChainModal}
              type="button"
            >
              Wrong network
            </button>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              className="hidden rounded-xl border border-default px-3 py-2 text-xs text-muted-foreground transition hover:bg-[color:var(--surface-muted)] hover:text-foreground md:inline-flex"
              onClick={openChainModal}
              type="button"
            >
              {chain.name}
            </button>
            <button
              className="inline-flex items-center justify-center rounded-xl border border-default px-3 py-2 text-xs font-medium text-foreground transition hover:bg-[color:var(--surface-muted)]"
              onClick={openAccountModal}
              type="button"
            >
              {account.displayName}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

const HeaderMenuLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href }) => {
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={`${navLinkClassName} ${isActive ? "bg-[color:var(--surface-muted)] text-foreground" : ""}`}
            onClick={onNavigate}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
};

export const Header = () => {
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(mobileMenuRef, () => {
    mobileMenuRef.current?.removeAttribute("open");
  });

  return (
    <header className="sticky top-0 z-20 border-b border-default bg-[color:var(--background)]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 overflow-hidden rounded-xl border border-default bg-[color:var(--surface-muted)]">
              <Image alt="SE2 logo" fill src="/logo.svg" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Rate Limit Lab</p>
              <p className="text-[11px] text-muted-foreground">Rate limiter simulator</p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          <HeaderMenuLinks />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <SwitchTheme />
          <ConnectedWalletButton />
        </div>

        <details className="relative md:hidden" ref={mobileMenuRef}>
          <summary className="flex list-none items-center justify-center rounded-xl border border-default bg-[color:var(--surface-muted)] p-2 text-foreground marker:hidden">
            <Bars3Icon className="h-5 w-5" />
          </summary>
          <div className="absolute right-0 top-14 flex min-w-56 flex-col gap-2 rounded-3xl border border-default bg-[color:var(--surface)] p-3 shadow-2xl">
            <HeaderMenuLinks
              onNavigate={() => {
                mobileMenuRef.current?.removeAttribute("open");
              }}
            />
            <SwitchTheme />
            <div className="pt-1">
              <ConnectedWalletButton />
            </div>
          </div>
        </details>
      </div>
    </header>
  );
};
