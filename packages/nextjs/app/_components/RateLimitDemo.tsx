"use client";

import { useState } from "react";
import { useReadContracts } from "wagmi";
import {
  BucketedRateLimiterSourceButton,
  TokenBucketRateLimiterSourceButton,
} from "~~/components/rate-limit/ContractSourceSheet";
import {
  BucketBars,
  Mechanism,
  MechanismButton,
  MetricStrip,
  ReservoirMeter,
  WorkflowPanel,
} from "~~/components/rate-limit/demo-ui";
import { ExecutionTimeline } from "~~/components/rate-limit/ui";
import { useBorrowExecution } from "~~/hooks/rate-limit/useBorrowExecution";
import { useLiveTokenBucketMetrics } from "~~/hooks/rate-limit/useLiveTokenBucketMetrics";
import { useDeployedContract } from "~~/hooks/useDeployedContract";
import { formatAmount, formatDuration } from "~~/utils/rateLimit";

const BucketedPanel = () => {
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

const TokenPanel = () => {
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
