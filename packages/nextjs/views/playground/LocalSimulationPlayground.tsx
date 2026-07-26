"use client";

import { useMemo, useState } from "react";
import { DEFAULT_BUCKETED_BORROW_AMOUNT, DEFAULT_TOKEN_BUCKET_BORROW_AMOUNT } from "@/configs/constants";
import type { BucketedWindowPreset } from "@/types/rate-limit";
import {
  DEFAULT_BUCKETED_WINDOW_PRESET,
  createInitialBucketedLocalState,
  getBucketedLocalWindowConfig,
} from "@/utils/localBucketed";
import { createInitialTokenBucketLocalState } from "@/utils/localTokenBucket";
import { BucketedLocalPanel } from "@/views/playground/BucketedLocalPanel";
import { TokenLocalPanel } from "@/views/playground/TokenLocalPanel";
import { MechanismTabs } from "@/views/shared/rate-limit/MechanismTabs";
import type { RateLimitMechanism } from "@/views/shared/rate-limit/MechanismTabs";

export const LocalSimulationPlayground = () => {
  const [activeMechanism, setActiveMechanism] = useState<RateLimitMechanism>("bucketed");
  const [bucketedWindowPreset, setBucketedWindowPreset] =
    useState<BucketedWindowPreset>(DEFAULT_BUCKETED_WINDOW_PRESET);
  const [bucketedState, setBucketedState] = useState(createInitialBucketedLocalState);
  const [tokenState, setTokenState] = useState(createInitialTokenBucketLocalState);
  const [bucketedAmount, setBucketedAmount] = useState(DEFAULT_BUCKETED_BORROW_AMOUNT);
  const [tokenAmount, setTokenAmount] = useState(DEFAULT_TOKEN_BUCKET_BORROW_AMOUNT);
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
    setBucketedAmount(DEFAULT_BUCKETED_BORROW_AMOUNT);
    setTokenAmount(DEFAULT_TOKEN_BUCKET_BORROW_AMOUNT);
    setResetKey(current => current + 1);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-14 pt-8 sm:px-8 lg:px-10">
      <section>
        <p className="max-w-lg text-sm leading-6 text-muted-foreground">
          Compare rolling-window and token-bucket limits.
        </p>
      </section>

      <MechanismTabs onChange={setActiveMechanism} value={activeMechanism} />

      <div className="mt-10">
        {activeMechanism === "bucketed" ? (
          <BucketedLocalPanel
            key={`bucketed-${resetKey}`}
            amount={bucketedAmount}
            amountPlaceholder={DEFAULT_BUCKETED_BORROW_AMOUNT}
            bucketedState={bucketedState}
            onAmountChange={setBucketedAmount}
            onReset={resetPlayground}
            onWindowPresetChange={setBucketedLimitWindow}
            setBucketedState={setBucketedState}
            windowConfig={bucketedWindowConfig}
            windowPreset={bucketedWindowPreset}
          />
        ) : (
          <TokenLocalPanel
            key={`token-${resetKey}`}
            amount={tokenAmount}
            amountPlaceholder={DEFAULT_TOKEN_BUCKET_BORROW_AMOUNT}
            onAmountChange={setTokenAmount}
            onReset={resetPlayground}
            setTokenState={setTokenState}
            tokenState={tokenState}
          />
        )}
      </div>
    </div>
  );
};
