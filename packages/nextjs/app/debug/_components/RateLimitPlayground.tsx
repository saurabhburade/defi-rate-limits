"use client";

import { useState } from "react";
import {
  BorrowFlowCard,
  CompactTabButton,
  ExecutionTimeline,
  Eyebrow,
  FieldCard,
  LinkButton,
  ValueCard,
  shellCardClassName,
} from "~~/components/rate-limit/ui";
import { useBorrowExecution } from "~~/hooks/rate-limit/useBorrowExecution";
import { useLiveTokenBucketMetrics } from "~~/hooks/rate-limit/useLiveTokenBucketMetrics";
import { useDeployedContractInfo, useScaffoldReadContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { formatAmount, formatDuration, shortAddress } from "~~/utils/rateLimit";
import { ContractName } from "~~/utils/scaffold-eth/contract";

const ContractHeader = ({ contractName }: { contractName: ContractName }) => {
  const { targetNetwork } = useTargetNetwork();
  const { data: deployedContract } = useDeployedContractInfo({ contractName });

  return (
    <div className={`${shellCardClassName} grid gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start`}>
      <div className="min-w-0">
        <Eyebrow>Contract Playground</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl">{contractName}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Direct read and write access to the deployed limiter, using the same guarded send flow as the main demo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:w-fit">
        <div className="rounded-2xl border border-default surface-muted p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Contract Address</p>
          <p className="mt-2 text-sm font-medium text-foreground">{shortAddress(deployedContract?.address)}</p>
        </div>
        <div className="rounded-2xl border border-default surface-muted p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Network</p>
          <p className="mt-2 text-sm font-medium text-foreground">{targetNetwork.name}</p>
        </div>
      </div>
    </div>
  );
};

const BucketedContractPanel = () => {
  const [amount, setAmount] = useState("250000");
  const readOptions = { query: { refetchInterval: 3000 } };

  const { data: limit } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "limit",
    ...readOptions,
  });
  const execution = useBorrowExecution({
    contractName: "BucketedRateLimiter",
    amount,
    idleDetail: "Run the same public-client preflight here before you prompt the wallet on the debug page.",
  });
  const { data: bucketSize } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "bucketSize",
    ...readOptions,
  });
  const { data: numBuckets } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "numBuckets",
    ...readOptions,
  });
  const { data: currentBucketId } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "currentBucketId",
    ...readOptions,
  });
  const { data: windowUsage } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "windowUsage",
    ...readOptions,
  });
  const { data: remainingCapacity } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "remainingCapacity",
    ...readOptions,
  });
  const { data: windowDuration } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "windowDuration",
    ...readOptions,
  });
  const { data: preview } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "previewBorrow",
    args: [execution.contractAmount],
    watch: false,
    query: { enabled: execution.contractAmount !== undefined, refetchInterval: 3000 },
  });
  const { data: recentBuckets } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "recentBuckets",
    ...readOptions,
  });

  const previewData = (preview as readonly [boolean, bigint, bigint] | undefined) ?? [false, 0n, 0n];
  const bucketIndices = (recentBuckets?.[0] as bigint[] | undefined) ?? [];
  const bucketAmounts = (recentBuckets?.[1] as bigint[] | undefined) ?? [];
  const isBusy =
    execution.phase === "simulating" || execution.phase === "awaiting_wallet" || execution.phase === "confirming";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ValueCard label="Window Limit" value={formatAmount(limit, true)} />
        <ValueCard label="Window Usage" value={formatAmount(windowUsage, true)} />
        <ValueCard label="Remaining Capacity" value={formatAmount(remainingCapacity, true)} />
        <ValueCard
          label="Window Layout"
          value={bucketSize && numBuckets ? `${Number(bucketSize) / 60}m × ${numBuckets.toString()}` : "--"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <FieldCard
          title="Execution Flow"
          description="The debug route uses the same four-stage execution path as production: validate, simulate, wallet approval, then confirmation."
        >
          <BorrowFlowCard
            amount={amount}
            onAmountChange={setAmount}
            amountPlaceholder="250000"
            onSimulate={execution.simulate}
            onSend={execution.send}
            canSubmit={execution.canSubmit}
            busy={isBusy}
            timeline={
              <ExecutionTimeline
                title={execution.status.title}
                detail={execution.status.detail}
                steps={execution.steps}
                logs={execution.logs}
                txHash={execution.status.txHash}
                explorerUrl={execution.status.explorerUrl}
                isSuccess={execution.phase === "confirmed"}
                isError={execution.phase === "failed"}
              />
            }
          />
        </FieldCard>

        <FieldCard
          title="Window Internals"
          description="Useful low-level state for validating the ring-buffer behavior and the current active window."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ValueCard label="Current Bucket" value={currentBucketId?.toLocaleString("en-US") ?? "--"} />
            <ValueCard
              label="Window Duration"
              value={windowDuration ? `${Math.round(Number(windowDuration) / 60)} min` : "--"}
            />
            <ValueCard label="Preview Allowed" value={previewData[0] ? "Yes" : "No"} />
            <ValueCard label="Remaining After" value={formatAmount(previewData[2], true)} />
          </div>
        </FieldCard>
      </div>

      <FieldCard
        title="Recent Buckets"
        description="The latest rolling-window slots from oldest to newest. This is the bounded storage shape that matters for the bucketed limiter."
      >
        <div className="overflow-hidden rounded-2xl border border-default">
          <div className="grid grid-cols-[1fr_1fr] border-b border-default bg-[color:var(--surface)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            <span>Bucket Index</span>
            <span>Amount</span>
          </div>
          <div className="divide-y divide-[color:var(--border)]">
            {bucketIndices.map((bucketIndex, index) => (
              <div
                key={`${bucketIndex}-${index}`}
                className="grid grid-cols-[1fr_1fr] px-4 py-3 text-sm text-foreground/80"
              >
                <span>{bucketIndex.toString()}</span>
                <span>{formatAmount(bucketAmounts[index], true)}</span>
              </div>
            ))}
          </div>
        </div>
      </FieldCard>
    </div>
  );
};

const TokenBucketContractPanel = () => {
  const [amount, setAmount] = useState("200000");
  const readOptions = { query: { refetchInterval: 3000 } };

  const { data: maxCapacity } = useScaffoldReadContract({
    contractName: "TokenBucketRateLimiter",
    functionName: "maxCapacity",
    ...readOptions,
  });
  const execution = useBorrowExecution({
    contractName: "TokenBucketRateLimiter",
    amount,
    idleDetail:
      "The debug route keeps the same preflight-first send flow so wallet prompts only happen after a viem simulation passes.",
  });
  const { data: refillRate } = useScaffoldReadContract({
    contractName: "TokenBucketRateLimiter",
    functionName: "refillRate",
    ...readOptions,
  });
  const { data: capacity } = useScaffoldReadContract({
    contractName: "TokenBucketRateLimiter",
    functionName: "capacity",
    ...readOptions,
  });
  const { data: lastUpdate } = useScaffoldReadContract({
    contractName: "TokenBucketRateLimiter",
    functionName: "lastUpdate",
    ...readOptions,
  });
  const { data: availableCapacity } = useScaffoldReadContract({
    contractName: "TokenBucketRateLimiter",
    functionName: "availableCapacity",
    ...readOptions,
  });
  const { data: secondsUntilFull } = useScaffoldReadContract({
    contractName: "TokenBucketRateLimiter",
    functionName: "secondsUntilFull",
    ...readOptions,
  });
  const { data: secondsUntilAvailable } = useScaffoldReadContract({
    contractName: "TokenBucketRateLimiter",
    functionName: "secondsUntilAvailable",
    args: [execution.contractAmount],
    watch: false,
    query: { enabled: execution.contractAmount !== undefined, refetchInterval: 3000 },
  });
  const { data: preview } = useScaffoldReadContract({
    contractName: "TokenBucketRateLimiter",
    functionName: "previewBorrow",
    args: [execution.contractAmount],
    watch: false,
    query: { enabled: execution.contractAmount !== undefined, refetchInterval: 3000 },
  });

  const previewData = (preview as readonly [boolean, bigint, bigint] | undefined) ?? [false, 0n, 0n];
  const { liveAvailableCapacity, liveSecondsUntilAvailable, liveSecondsUntilFull } = useLiveTokenBucketMetrics({
    availableCapacity,
    maxCapacity,
    refillRate,
    secondsUntilFull,
    secondsUntilAvailable,
    animateAvailable: true,
  });
  const isBusy =
    execution.phase === "simulating" || execution.phase === "awaiting_wallet" || execution.phase === "confirming";
  const formattedLastUpdate = lastUpdate ? new Date(Number(lastUpdate) * 1000).toLocaleString("en-US") : "--";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ValueCard label="Max Capacity" value={formatAmount(maxCapacity, true)} />
        <ValueCard label="Available Capacity" value={formatAmount(liveAvailableCapacity, true)} />
        <ValueCard label="Refill Rate / Sec" value={formatAmount(refillRate)} />
        <ValueCard label="Seconds Until Full" value={formatDuration(liveSecondsUntilFull)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <FieldCard
          title="Execution Flow"
          description="This route is still production-like: simulate on the public client, wait for the wallet signature, then watch confirmation."
        >
          <BorrowFlowCard
            amount={amount}
            onAmountChange={setAmount}
            amountPlaceholder="200000"
            onSimulate={execution.simulate}
            onSend={execution.send}
            canSubmit={execution.canSubmit}
            busy={isBusy}
            timeline={
              <ExecutionTimeline
                title={execution.status.title}
                detail={execution.status.detail}
                steps={execution.steps}
                logs={execution.logs}
                txHash={execution.status.txHash}
                explorerUrl={execution.status.explorerUrl}
                isSuccess={execution.phase === "confirmed"}
                isError={execution.phase === "failed"}
              />
            }
          />
        </FieldCard>

        <FieldCard
          title="Reservoir Internals"
          description="Raw contract state for the last stored capacity and timestamp anchor used by the refill calculation."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ValueCard label="Stored Capacity" value={formatAmount(capacity, true)} />
            <ValueCard label="Last Update" value={formattedLastUpdate} />
            <ValueCard label="Preview Allowed" value={previewData[0] ? "Yes" : "No"} />
            <ValueCard label="Wait If Blocked" value={formatDuration(liveSecondsUntilAvailable)} />
          </div>
        </FieldCard>
      </div>
    </div>
  );
};

export const RateLimitPlayground = () => {
  const [selectedContract, setSelectedContract] = useState<ContractName>("BucketedRateLimiter");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ContractHeader contractName={selectedContract} />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <CompactTabButton
          active={selectedContract === "BucketedRateLimiter"}
          onClick={() => setSelectedContract("BucketedRateLimiter")}
        >
          BucketedRateLimiter
        </CompactTabButton>
        <CompactTabButton
          active={selectedContract === "TokenBucketRateLimiter"}
          onClick={() => setSelectedContract("TokenBucketRateLimiter")}
        >
          TokenBucketRateLimiter
        </CompactTabButton>
        <LinkButton href="/">Back to comparison</LinkButton>
      </div>

      <div className="mt-5">
        {selectedContract === "BucketedRateLimiter" ? <BucketedContractPanel /> : <TokenBucketContractPanel />}
      </div>
    </div>
  );
};
