"use client";

import { useCallback, useMemo } from "react";
import { useLocalBorrowExecution } from "@/hooks/useLocalBorrowExecution";
import { useNowSeconds } from "@/hooks/useNowSeconds";
import { BucketedLocalState, BucketedWindowConfig, BucketedWindowPreset } from "@/types/rate-limit";
import { formatAmount } from "@/utils/formatting";
import { applyBucketedLocalBorrow, getBucketedLocalSnapshot, previewBucketedLocalBorrow } from "@/utils/localBucketed";
import { BucketedWindowSelect } from "@/views/playground/BucketedWindowSelect";
import { BucketBars } from "@/views/shared/rate-limit/BucketBars";
import { BucketedRateLimiterSourceButton } from "@/views/shared/rate-limit/ContractSourceButton";
import { ExecutionTimeline } from "@/views/shared/rate-limit/ExecutionTimeline";
import { MetricStrip } from "@/views/shared/rate-limit/MetricStrip";
import { RateLimitPanelHeader } from "@/views/shared/rate-limit/RateLimitPanelHeader";
import { WorkflowPanel } from "@/views/shared/rate-limit/WorkflowPanel";

export const BucketedLocalPanel = ({
  amount,
  amountPlaceholder,
  bucketedState,
  onAmountChange,
  onReset,
  onWindowPresetChange,
  setBucketedState,
  windowConfig,
  windowPreset,
}: {
  amount: string;
  amountPlaceholder: string;
  bucketedState: BucketedLocalState;
  onAmountChange: (value: string) => void;
  onReset: () => void;
  onWindowPresetChange: (value: BucketedWindowPreset) => void;
  setBucketedState: (state: BucketedLocalState) => void;
  windowConfig: BucketedWindowConfig;
  windowPreset: BucketedWindowPreset;
}) => {
  const currentNowSeconds = useNowSeconds();
  const snapshot = useMemo(
    () => getBucketedLocalSnapshot(bucketedState, currentNowSeconds, windowConfig),
    [bucketedState, currentNowSeconds, windowConfig],
  );

  const previewBorrow = useCallback(
    (borrowAmount: bigint, commitNowSeconds: number) =>
      previewBucketedLocalBorrow(bucketedState, borrowAmount, commitNowSeconds, windowConfig),
    [bucketedState, windowConfig],
  );
  const applyBorrow = useCallback(
    (borrowAmount: bigint, commitNowSeconds: number) => {
      const result = applyBucketedLocalBorrow(bucketedState, borrowAmount, commitNowSeconds, windowConfig);
      if (result.allowed && result.state) setBucketedState(result.state);
      return result;
    },
    [bucketedState, setBucketedState, windowConfig],
  );
  const execution = useLocalBorrowExecution({
    amount,
    applyBorrow,
    idleDetail: "Run a local preview before applying the borrow to this page state.",
    previewBorrow,
  });
  const handleAmountChange = (value: string) => {
    execution.reset();
    onAmountChange(value);
  };

  return (
    <section className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
      <div className="min-w-0">
        <RateLimitPanelHeader fileName="BucketedRateLimiter.sol" title="Strict rolling window">
          <BucketedRateLimiterSourceButton />
        </RateLimitPanelHeader>
        <div className="mt-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_12rem] xl:items-end">
            <MetricStrip
              items={[
                { label: "Limit", value: formatAmount(snapshot.limit, true) },
                { label: "Window", value: windowConfig.label },
                { label: "Used", value: formatAmount(snapshot.windowUsage, true) },
                { label: "Remaining", value: formatAmount(snapshot.remainingCapacity, true) },
              ]}
            />
            <BucketedWindowSelect disabled={execution.busy} onChange={onWindowPresetChange} value={windowPreset} />
          </div>
        </div>

        <BucketBars values={snapshot.recentBuckets} limit={snapshot.limit} bucketSize={snapshot.bucketSize} />
      </div>

      <WorkflowPanel
        amount={amount}
        amountPlaceholder={amountPlaceholder}
        busy={execution.busy}
        busyButton={execution.phase === "simulating" ? "simulate" : "send"}
        busyLabel="Applying"
        canSubmit={execution.canSubmit}
        chainTag="local"
        onAmountChange={handleAmountChange}
        onReset={onReset}
        onSend={execution.apply}
        onSimulate={execution.simulate}
        sendLabel="Borrow"
        simulateBusyLabel="Checking"
        simulateLabel="Validate"
        timeline={
          <ExecutionTimeline
            detail={execution.status.detail}
            logs={execution.logs}
            steps={execution.steps}
            title={execution.status.title}
          />
        }
      />
    </section>
  );
};
