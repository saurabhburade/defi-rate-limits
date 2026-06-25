"use client";

import { useMemo, useState } from "react";
import { buttonBaseClassName } from "@/components/common/Button";
import { useNowSeconds } from "@/hooks/useNowSeconds";
import {
  DEFAULT_BUCKETED_WINDOW_PRESET,
  createInitialBucketedLocalState,
  getBucketedLocalWindowConfig,
} from "@/libs/rate-limit/localBucketed";
import { createInitialTokenBucketLocalState } from "@/libs/rate-limit/localTokenBucket";
import { BucketedWindowPreset } from "@/types/rate-limit";
import { BucketedLocalPanel } from "@/views/playground/components/BucketedLocalPanel";
import { TokenLocalPanel } from "@/views/playground/components/TokenLocalPanel";

const DEFAULT_BUCKETED_AMOUNT = "250000";
const DEFAULT_TOKEN_AMOUNT = "200000";

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

export const LocalSimulationPlayground = () => {
  const currentNowSeconds = useNowSeconds();
  const [activeMechanism, setActiveMechanism] = useState<Mechanism>("bucketed");
  const [bucketedWindowPreset, setBucketedWindowPreset] =
    useState<BucketedWindowPreset>(DEFAULT_BUCKETED_WINDOW_PRESET);
  const [bucketedState, setBucketedState] = useState(createInitialBucketedLocalState);
  const [tokenState, setTokenState] = useState(createInitialTokenBucketLocalState);
  const [bucketedAmount, setBucketedAmount] = useState(DEFAULT_BUCKETED_AMOUNT);
  const [tokenAmount, setTokenAmount] = useState(DEFAULT_TOKEN_AMOUNT);
  const [resetKey, setResetKey] = useState(0);
  const bucketedWindowConfig = useMemo(
    () => getBucketedLocalWindowConfig(bucketedWindowPreset),
    [bucketedWindowPreset],
  );

  const setBucketedLimitWindow = (nextPreset: BucketedWindowPreset) => {
    const nextConfig = getBucketedLocalWindowConfig(nextPreset);
    setBucketedWindowPreset(nextPreset);
    setBucketedState(createInitialBucketedLocalState(nextConfig));
    setResetKey(current => current + 1);
  };

  const resetPlayground = () => {
    setBucketedState(createInitialBucketedLocalState(bucketedWindowConfig));
    setTokenState(createInitialTokenBucketLocalState());
    setBucketedAmount(DEFAULT_BUCKETED_AMOUNT);
    setTokenAmount(DEFAULT_TOKEN_AMOUNT);
    setResetKey(current => current + 1);
  };

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

      <div className="mt-10">
        {activeMechanism === "bucketed" ? (
          <BucketedLocalPanel
            amount={bucketedAmount}
            amountPlaceholder={DEFAULT_BUCKETED_AMOUNT}
            bucketedState={bucketedState}
            currentNowSeconds={currentNowSeconds}
            onAmountChange={setBucketedAmount}
            onReset={resetPlayground}
            onWindowPresetChange={setBucketedLimitWindow}
            resetKey={resetKey}
            setBucketedState={setBucketedState}
            windowConfig={bucketedWindowConfig}
            windowPreset={bucketedWindowPreset}
          />
        ) : (
          <TokenLocalPanel
            amount={tokenAmount}
            amountPlaceholder={DEFAULT_TOKEN_AMOUNT}
            currentNowSeconds={currentNowSeconds}
            onAmountChange={setTokenAmount}
            onReset={resetPlayground}
            resetKey={resetKey}
            setTokenState={setTokenState}
            tokenState={tokenState}
          />
        )}
      </div>
    </div>
  );
};
