"use client";

import { useCallback, useMemo } from "react";
import { useLocalBorrowExecution } from "@/hooks/useLocalBorrowExecution";
import { useNowSeconds } from "@/hooks/useNowSeconds";
import { TokenBucketLocalState } from "@/types/rate-limit";
import { formatAmount, formatDuration } from "@/utils/formatting";
import {
  applyTokenBucketLocalBorrow,
  getTokenBucketLocalSnapshot,
  previewTokenBucketLocalBorrow,
} from "@/utils/localTokenBucket";
import { TokenBucketRateLimiterSourceButton } from "@/views/shared/rate-limit/ContractSourceButton";
import { ExecutionTimeline } from "@/views/shared/rate-limit/ExecutionTimeline";
import { MetricStrip } from "@/views/shared/rate-limit/MetricStrip";
import { RateLimitPanelHeader } from "@/views/shared/rate-limit/RateLimitPanelHeader";
import { ReservoirMeter } from "@/views/shared/rate-limit/ReservoirMeter";
import { WorkflowPanel } from "@/views/shared/rate-limit/WorkflowPanel";

export const TokenLocalPanel = ({
  amount,
  amountPlaceholder,
  onAmountChange,
  onReset,
  setTokenState,
  tokenState,
}: {
  amount: string;
  amountPlaceholder: string;
  onAmountChange: (value: string) => void;
  onReset: () => void;
  setTokenState: (state: TokenBucketLocalState) => void;
  tokenState: TokenBucketLocalState;
}) => {
  const currentNowSeconds = useNowSeconds();
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
  });
  const refillPerMinute = snapshot.refillRate * 60n;
  const handleAmountChange = (value: string) => {
    execution.reset();
    onAmountChange(value);
  };

  return (
    <section className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
      <div className="min-w-0">
        <RateLimitPanelHeader fileName="TokenBucketRateLimiter.sol" title="Burst and recover">
          <TokenBucketRateLimiterSourceButton />
        </RateLimitPanelHeader>

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
