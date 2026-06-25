"use client";

import { useState } from "react";
import { buttonBaseClassName } from "@/components/common/Button";
import { BucketedPanel } from "@/views/home/components/BucketedPanel";
import { TokenPanel } from "@/views/home/components/TokenPanel";

type Mechanism = "bucketed" | "token";

const MechanismButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    className={`${buttonBaseClassName} px-4 ${
      active
        ? "bg-[color:var(--surface)] text-foreground shadow-[0_2px_12px_rgb(0_0_0/0.08)]"
        : "text-muted-foreground hover:text-foreground"
    }`}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
);

export const RateLimitDemo = () => {
  const [activeMechanism, setActiveMechanism] = useState<Mechanism>("bucketed");

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-14 pt-8 sm:px-8 lg:px-10">
      <section>
        <p className="max-w-lg text-sm leading-6 text-muted-foreground">
          Compare rolling-window and token-bucket limits with the same simulation-first path.
        </p>
      </section>

      <section className="mt-8 inline-grid w-full max-w-[320px] grid-cols-2 rounded-full bg-[color:var(--surface-muted)] p-1">
        <MechanismButton active={activeMechanism === "bucketed"} onClick={() => setActiveMechanism("bucketed")}>
          Bucketed window
        </MechanismButton>
        <MechanismButton active={activeMechanism === "token"} onClick={() => setActiveMechanism("token")}>
          Token bucket
        </MechanismButton>
      </section>

      <div className="mt-10">{activeMechanism === "bucketed" ? <BucketedPanel /> : <TokenPanel />}</div>
    </div>
  );
};
