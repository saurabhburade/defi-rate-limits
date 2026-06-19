"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { MenuIcon, SmileIcon } from "lucide-react";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { buttonBaseClassName, primaryButtonToneClassName, secondaryButtonClassName } from "~~/components/rate-limit/ui";
import { useOutsideClick } from "~~/hooks/useOutsideClick";

type HeaderMenuLink = {
  label: string;
  href: string;
};

const menuLinks: HeaderMenuLink[] = [
  { label: "POC", href: "/" },
  { label: "Playground", href: "/playground" },
];

const connectButtonClassName = `${buttonBaseClassName} ${primaryButtonToneClassName}`;
const headerNavLinkClassName =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3 text-sm font-medium transition-all";

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
              className={`${buttonBaseClassName} border border-red-600 bg-red-600 text-white hover:bg-red-700`}
              onClick={openChainModal}
              type="button"
            >
              Wrong network
            </button>
          );
        }

        return (
          <button className={`${secondaryButtonClassName} gap-2.5`} onClick={openAccountModal} type="button">
            <SmileIcon aria-hidden="true" className="size-4 text-muted-foreground" />
            {account.displayName}
          </button>
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
            className={`${headerNavLinkClassName} ${
              isActive
                ? "bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)]"
                : "text-muted-foreground hover:bg-[color:var(--surface-muted)] hover:text-foreground"
            }`}
            href={href}
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
    <header className="sticky top-0 z-20 border-b border-default bg-[color:var(--background)]/94 backdrop-blur-xl">
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 sm:px-8 md:grid-cols-[minmax(10rem,1fr)_auto_minmax(10rem,1fr)] lg:px-10">
        <Link className="flex min-w-0 items-center justify-self-start" href="/">
          <span className="truncate text-sm font-semibold tracking-[-0.02em] text-foreground">Defi Rate Limits</span>
        </Link>

        <nav className="hidden items-center gap-2 justify-self-center md:flex">
          <HeaderMenuLinks />
        </nav>

        <div className="hidden items-center gap-3 justify-self-end md:flex">
          <SwitchTheme />
          <ConnectedWalletButton />
        </div>

        <details className="relative md:hidden" ref={mobileMenuRef}>
          <summary className="flex h-8 w-8 list-none items-center justify-center rounded-full bg-[color:var(--surface-muted)] text-foreground transition-all hover:bg-[color:var(--surface-strong)] marker:hidden">
            <MenuIcon className="h-5 w-5" />
          </summary>
          <div className="absolute right-0 top-14 flex min-w-64 flex-col gap-5 rounded-[28px] bg-[color:var(--surface)] p-5 shadow-[0_18px_60px_rgb(0_0_0/0.12)]">
            <HeaderMenuLinks
              onNavigate={() => {
                mobileMenuRef.current?.removeAttribute("open");
              }}
            />
            <SwitchTheme />
            <ConnectedWalletButton />
          </div>
        </details>
      </div>
    </header>
  );
};
