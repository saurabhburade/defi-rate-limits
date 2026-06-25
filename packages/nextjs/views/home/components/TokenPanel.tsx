"use client";

import { useState } from "react";
import { useBorrowExecution } from "@/hooks/rate-limit/useBorrowExecution";
import { useLiveTokenBucketMetrics } from "@/hooks/rate-limit/useLiveTokenBucketMetrics";
import { useDeployedContract } from "@/hooks/useDeployedContract";
import { formatAmount, formatDuration } from "@/libs/rate-limit/formatting";
import { TokenBucketRateLimiterSourceButton } from "@/views/shared/rate-limit/ContractSourceButton";
import { ExecutionTimeline } from "@/views/shared/rate-limit/ExecutionTimeline";
import { MetricStrip } from "@/views/shared/rate-limit/MetricStrip";
import { ReservoirMeter } from "@/views/shared/rate-limit/ReservoirMeter";
import { WorkflowPanel } from "@/views/shared/rate-limit/WorkflowPanel";
import { useReadContracts } from "wagmi";

export const TokenPanel = () => {
  const [amount, setAmount] = useState("200000");
  const { data: tokenContract } = useDeployedContract({ contractName: "TokenBucketRateLimiter" });
  const execution = useBorrowExecution({
    contractName: "TokenBucketRateLimiter",
    amount,
    idleDetail:
      "Run the same simulation first so the app can prove the reservoir has enough capacity before wallet approval.",
  });

  const { data: tokenReads } = useReadContracts({
    allowFailure: false,
    contracts: tokenContract
      ? [
          { address: tokenContract.address, abi: tokenContract.abi, functionName: "maxCapacity" },
          { address: tokenContract.address, abi: tokenContract.abi, functionName: "refillRate" },
          { address: tokenContract.address, abi: tokenContract.abi, functionName: "availableCapacity" },
          { address: tokenContract.address, abi: tokenContract.abi, functionName: "secondsUntilFull" },
        ]
      : [],
    query: {
      enabled: Boolean(tokenContract),
      refetchInterval: 3000,
    },
  });

  const maxCapacity = tokenReads?.[0] as bigint | undefined;
  const refillRate = tokenReads?.[1] as bigint | undefined;
  const availableCapacity = tokenReads?.[2] as bigint | undefined;
  const secondsUntilFull = tokenReads?.[3] as bigint | undefined;
  const { liveAvailableCapacity, liveSecondsUntilFull } = useLiveTokenBucketMetrics({
    animateAvailable: true,
    availableCapacity,
    maxCapacity,
    refillRate,
    secondsUntilFull,
  });
  const isBusy =
    execution.phase === "simulating" || execution.phase === "awaiting_wallet" || execution.phase === "confirming";
  const refillPerMinute = refillRate ? refillRate * 60n : undefined;

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
              { label: "Capacity", value: formatAmount(maxCapacity, true) },
              { label: "Available", value: formatAmount(liveAvailableCapacity, true) },
              { label: "Refill / Min", value: formatAmount(refillPerMinute, true) },
              { label: "Full In", value: formatDuration(liveSecondsUntilFull) },
            ]}
          />
        </div>

        <ReservoirMeter total={maxCapacity} value={liveAvailableCapacity} />
      </div>

      <WorkflowPanel
        amount={amount}
        amountPlaceholder="200000"
        busy={isBusy}
        canSubmit={execution.canSubmit}
        chainTag={execution.chainTag}
        onAmountChange={setAmount}
        onSend={execution.send}
        onSimulate={execution.simulate}
        simulateLabel="Validate"
        timeline={
          <ExecutionTimeline
            detail={execution.status.detail}
            explorerUrl={execution.status.explorerUrl}
            logs={execution.logs}
            steps={execution.steps}
            title={execution.status.title}
            txHash={execution.status.txHash}
          />
        }
      />
    </section>
  );
};
