"use client";

import { useState } from "react";
import { useBorrowExecution } from "@/hooks/rate-limit/useBorrowExecution";
import { useDeployedContract } from "@/hooks/useDeployedContract";
import { formatAmount } from "@/libs/rate-limit/formatting";
import { BucketBars } from "@/views/shared/rate-limit/BucketBars";
import { BucketedRateLimiterSourceButton } from "@/views/shared/rate-limit/ContractSourceButton";
import { ExecutionTimeline } from "@/views/shared/rate-limit/ExecutionTimeline";
import { MetricStrip } from "@/views/shared/rate-limit/MetricStrip";
import { WorkflowPanel } from "@/views/shared/rate-limit/WorkflowPanel";
import { useReadContracts } from "wagmi";

export const BucketedPanel = () => {
  const [amount, setAmount] = useState("250000");
  const { data: bucketedContract } = useDeployedContract({ contractName: "BucketedRateLimiter" });
  const execution = useBorrowExecution({
    contractName: "BucketedRateLimiter",
    amount,
    idleDetail: "Use the simulation step to verify the rolling-window cap before the wallet prompt appears.",
  });

  const { data: bucketedReads } = useReadContracts({
    allowFailure: false,
    contracts: bucketedContract
      ? [
          { address: bucketedContract.address, abi: bucketedContract.abi, functionName: "limit" },
          { address: bucketedContract.address, abi: bucketedContract.abi, functionName: "bucketSize" },
          { address: bucketedContract.address, abi: bucketedContract.abi, functionName: "windowUsage" },
          { address: bucketedContract.address, abi: bucketedContract.abi, functionName: "remainingCapacity" },
          { address: bucketedContract.address, abi: bucketedContract.abi, functionName: "recentBuckets" },
        ]
      : [],
    query: {
      enabled: Boolean(bucketedContract),
      refetchInterval: 3000,
    },
  });

  const limit = bucketedReads?.[0] as bigint | undefined;
  const bucketSize = bucketedReads?.[1] as bigint | undefined;
  const windowUsage = bucketedReads?.[2] as bigint | undefined;
  const remainingCapacity = bucketedReads?.[3] as bigint | undefined;
  const recentBuckets = bucketedReads?.[4] as readonly [bigint[], bigint[]] | undefined;
  const bucketValues = (recentBuckets?.[1] as bigint[] | undefined) ?? Array.from({ length: 6 }, () => 0n);
  const isBusy =
    execution.phase === "simulating" || execution.phase === "awaiting_wallet" || execution.phase === "confirming";

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
          <MetricStrip
            items={[
              { label: "Limit", value: formatAmount(limit, true) },
              { label: "Used", value: formatAmount(windowUsage, true) },
              { label: "Remaining", value: formatAmount(remainingCapacity, true) },
            ]}
          />
        </div>

        <BucketBars values={bucketValues} limit={limit} bucketSize={bucketSize} />
      </div>

      <WorkflowPanel
        amount={amount}
        amountPlaceholder="250000"
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
