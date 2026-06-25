"use client";

import { useCallback, useMemo } from "react";
import { useLocalBorrowExecution } from "@/hooks/rate-limit/useLocalBorrowExecution";
import { formatAmount } from "@/libs/rate-limit/formatting";
import {
  applyBucketedLocalBorrow,
  getBucketedLocalSnapshot,
  previewBucketedLocalBorrow,
} from "@/libs/rate-limit/localBucketed";
import { BucketedLocalState, BucketedWindowConfig, BucketedWindowPreset } from "@/types/rate-limit";
import { BucketedWindowSelect } from "@/views/playground/components/BucketedWindowSelect";
import { BucketBars } from "@/views/shared/rate-limit/BucketBars";
import { BucketedRateLimiterSourceButton } from "@/views/shared/rate-limit/ContractSourceButton";
import { ExecutionTimeline } from "@/views/shared/rate-limit/ExecutionTimeline";
import { MetricStrip } from "@/views/shared/rate-limit/MetricStrip";
import { WorkflowPanel } from "@/views/shared/rate-limit/WorkflowPanel";

export const BucketedLocalPanel = ({
  amount,
  amountPlaceholder,
  bucketedState,
  currentNowSeconds,
  onAmountChange,
  onReset,
  onWindowPresetChange,
  resetKey,
  setBucketedState,
  windowConfig,
  windowPreset,
}: {
  amount: string;
  amountPlaceholder: string;
  bucketedState: BucketedLocalState;
  currentNowSeconds: number;
  onAmountChange: (value: string) => void;
  onReset: () => void;
  onWindowPresetChange: (value: BucketedWindowPreset) => void;
  resetKey: number;
  setBucketedState: (state: BucketedLocalState) => void;
  windowConfig: BucketedWindowConfig;
  windowPreset: BucketedWindowPreset;
}) => {
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
    resetKey,
  });

  return (
    <section className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">Strict rolling window</h2>
          <div className="inline-flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground/50">BucketedRateLimiter.sol</span>
            <BucketedRateLimiterSourceButton />
          </div>
        </div>
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
        onAmountChange={onAmountChange}
        onReset={onReset}
        onSend={execution.apply}
        onSimulate={execution.simulate}
        sendLabel="Apply borrow"
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
