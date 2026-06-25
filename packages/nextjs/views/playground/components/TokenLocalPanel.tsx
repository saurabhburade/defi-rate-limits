"use client";

import { useCallback, useMemo } from "react";
import { useLocalBorrowExecution } from "@/hooks/rate-limit/useLocalBorrowExecution";
import { formatAmount, formatDuration } from "@/libs/rate-limit/formatting";
import {
  applyTokenBucketLocalBorrow,
  getTokenBucketLocalSnapshot,
  previewTokenBucketLocalBorrow,
} from "@/libs/rate-limit/localTokenBucket";
import { TokenBucketLocalState } from "@/types/rate-limit";
import { TokenBucketRateLimiterSourceButton } from "@/views/shared/rate-limit/ContractSourceButton";
import { ExecutionTimeline } from "@/views/shared/rate-limit/ExecutionTimeline";
import { MetricStrip } from "@/views/shared/rate-limit/MetricStrip";
import { ReservoirMeter } from "@/views/shared/rate-limit/ReservoirMeter";
import { WorkflowPanel } from "@/views/shared/rate-limit/WorkflowPanel";

export const TokenLocalPanel = ({
  amount,
  amountPlaceholder,
  currentNowSeconds,
  onAmountChange,
  onReset,
  resetKey,
  setTokenState,
  tokenState,
}: {
  amount: string;
  amountPlaceholder: string;
  currentNowSeconds: number;
  onAmountChange: (value: string) => void;
  onReset: () => void;
  resetKey: number;
  setTokenState: (state: TokenBucketLocalState) => void;
  tokenState: TokenBucketLocalState;
}) => {
  const snapshot = useMemo(
    () => getTokenBucketLocalSnapshot(tokenState, currentNowSeconds),
    [currentNowSeconds, tokenState],
  );

  const previewBorrow = useCallback(
    (borrowAmount: bigint, commitNowSeconds: number) =>
      previewTokenBucketLocalBorrow(tokenState, borrowAmount, commitNowSeconds),
    [tokenState],
  );
  const applyBorrow = useCallback(
    (borrowAmount: bigint, commitNowSeconds: number) => {
      const result = applyTokenBucketLocalBorrow(tokenState, borrowAmount, commitNowSeconds);
      if (result.allowed && result.state) setTokenState(result.state);
      return result;
    },
    [setTokenState, tokenState],
  );
  const execution = useLocalBorrowExecution({
    amount,
    applyBorrow,
    idleDetail: "Run a local preview before applying the borrow to this page state.",
    previewBorrow,
    resetKey,
  });
  const refillPerMinute = snapshot.refillRate * 60n;

  return (
    <section className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">Burst and recover</h2>
          <div className="inline-flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground/50">TokenBucketRateLimiter.sol</span>
            <TokenBucketRateLimiterSourceButton />
          </div>
        </div>

        <div className="mt-8">
          <MetricStrip
            items={[
              { label: "Capacity", value: formatAmount(snapshot.maxCapacity, true) },
              { label: "Available", value: formatAmount(snapshot.availableCapacity, true) },
              { label: "Refill / Min", value: formatAmount(refillPerMinute, true) },
              { label: "Full In", value: formatDuration(snapshot.secondsUntilFull) },
            ]}
          />
        </div>

        <ReservoirMeter total={snapshot.maxCapacity} value={snapshot.availableCapacity} />
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
