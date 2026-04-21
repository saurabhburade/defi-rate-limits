"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ArrowPathRoundedSquareIcon, ChartBarSquareIcon } from "@heroicons/react/24/outline";
import {
  BorrowFlowCard,
  ExecutionTimeline,
  Eyebrow,
  MetaPill,
  StatCard,
  TabButton,
  primaryButtonClassName,
  primaryButtonToneClassName,
  shellCardClassName,
} from "~~/components/rate-limit/ui";
import { useBorrowExecution } from "~~/hooks/rate-limit/useBorrowExecution";
import { useLiveTokenBucketMetrics } from "~~/hooks/rate-limit/useLiveTokenBucketMetrics";
import { useScaffoldReadContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { formatAmount, formatDuration, formatPercent, shortAddress } from "~~/utils/rateLimit";

type Mechanism = "bucketed" | "token";

const BucketBars = ({ values, limit, bucketSize }: { values: bigint[]; limit?: bigint; bucketSize?: bigint }) => {
  const bucketMinutes = bucketSize ? Number(bucketSize) / 60 : 10;

  return (
    <div className="rounded-2xl border border-default surface-muted p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Recent Buckets</Eyebrow>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            One slot per on-chain bucket. Old slots fall out of the rolling hour automatically.
          </p>
        </div>
        <div className="rounded-full border border-default bg-[color:var(--surface)] px-3 py-1 text-[11px] text-muted-foreground">
          {bucketMinutes}m slots
        </div>
      </div>
      <div className="mt-5 grid grid-cols-6 gap-2.5">
        {values.map((amount, index) => {
          const height = Math.max(7, Math.round(formatPercent(amount, limit) * 0.9));
          const distance = values.length - 1 - index;
          const label = distance === 0 ? "Now" : `${distance * bucketMinutes} min ago`;

          return (
            <div key={`${label}-${index}`}>
              <div className="flex h-28 items-end rounded-[18px] border border-default bg-[color:var(--surface)] p-2.5">
                <div
                  className="w-full rounded-[12px] bg-[linear-gradient(180deg,#111111_0%,#7a7a7a_100%)] dark:bg-[linear-gradient(180deg,#ffffff_0%,#7a7a7a_100%)]"
                  style={{ height: `${height}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
              <p className="mt-1 text-xs font-medium text-foreground">{formatAmount(amount, true)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PreviewCard = ({ title, headline, detail }: { title: string; headline: string; detail: string }) => (
  <div className={`${shellCardClassName} p-5`}>
    <Eyebrow>{title}</Eyebrow>
    <p className="mt-2 text-lg font-semibold text-foreground">{headline}</p>
    <p className="mt-3 text-sm leading-7 text-muted-foreground">{detail}</p>
  </div>
);

const BucketedPanel = () => {
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
    idleDetail: "Use the preflight step to verify the rolling-window cap before the wallet prompt appears.",
  });
  const { data: bucketSize } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "bucketSize",
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
  const { data: recentBuckets } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "recentBuckets",
    ...readOptions,
  });
  const { data: preview } = useScaffoldReadContract({
    contractName: "BucketedRateLimiter",
    functionName: "previewBorrow",
    args: [execution.contractAmount],
    watch: false,
    query: { enabled: execution.contractAmount !== undefined, refetchInterval: 3000 },
  });

  const previewData = (preview as readonly [boolean, bigint, bigint] | undefined) ?? [false, 0n, 0n];
  const bucketValues = (recentBuckets?.[1] as bigint[] | undefined) ?? Array.from({ length: 6 }, () => 0n);
  const isBusy =
    execution.phase === "simulating" || execution.phase === "awaiting_wallet" || execution.phase === "confirming";

  return (
    <section className="space-y-4">
      <div className={shellCardClassName}>
        <div className="p-5 sm:p-6">
          <Eyebrow>BucketedRateLimiter</Eyebrow>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">Strict rolling window</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Hard ceiling across the most recent rolling hour. Use this when you want deterministic recent-volume
            controls.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className={shellCardClassName}>
          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
            <StatCard label="Window Limit" value={formatAmount(limit, true)} />
            <StatCard label="Used Now" value={formatAmount(windowUsage, true)} />
            <StatCard label="Remaining" value={formatAmount(remainingCapacity, true)} />
          </div>
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <BucketBars values={bucketValues} limit={limit} bucketSize={bucketSize} />
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className={shellCardClassName}>
            <div className="p-5">
              <Eyebrow>Borrow Workflow</Eyebrow>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                The execution path is fixed: validate input, run a public-client simulation, prompt the wallet, then
                wait for confirmation.
              </p>
              <div className="mt-4">
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
              </div>
            </div>
          </div>

          <PreviewCard
            title="Preflight Preview"
            headline={
              execution.hasFreshSimulation
                ? previewData[0]
                  ? `${formatAmount(previewData[2], true)} remains after send`
                  : "Borrow would be blocked"
                : "Simulation output appears here"
            }
            detail={
              execution.hasFreshSimulation
                ? previewData[0]
                  ? "This preview is computed from current on-chain usage and matches the exact amount you most recently simulated."
                  : "The current rolling window does not have enough room for the requested amount. Lower the amount or wait for older buckets to age out."
                : "Run the simulation to confirm the window state for the typed amount before you prompt the wallet."
            }
          />
        </div>
      </div>
    </section>
  );
};

const TokenPanel = () => {
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
      "Run the same preflight first so the app can prove the reservoir has enough capacity before wallet approval.",
  });
  const { data: refillRate } = useScaffoldReadContract({
    contractName: "TokenBucketRateLimiter",
    functionName: "refillRate",
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
  const { data: preview } = useScaffoldReadContract({
    contractName: "TokenBucketRateLimiter",
    functionName: "previewBorrow",
    args: [execution.contractAmount],
    watch: false,
    query: { enabled: execution.contractAmount !== undefined, refetchInterval: 3000 },
  });
  const { data: secondsUntilAvailable } = useScaffoldReadContract({
    contractName: "TokenBucketRateLimiter",
    functionName: "secondsUntilAvailable",
    args: [execution.contractAmount],
    watch: false,
    query: { enabled: execution.contractAmount !== undefined, refetchInterval: 3000 },
  });

  const previewData = (preview as readonly [boolean, bigint, bigint] | undefined) ?? [false, 0n, 0n];
  const { liveAvailableCapacity, liveSecondsUntilAvailable, liveSecondsUntilFull } = useLiveTokenBucketMetrics({
    availableCapacity,
    secondsUntilFull,
    secondsUntilAvailable,
  });

  const isBusy =
    execution.phase === "simulating" || execution.phase === "awaiting_wallet" || execution.phase === "confirming";
  const refillPerMinute = refillRate ? refillRate * 60n : undefined;

  return (
    <section className="space-y-4">
      <div className={shellCardClassName}>
        <div className="p-5 sm:p-6">
          <Eyebrow>TokenBucketRateLimiter</Eyebrow>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">Burst and recover</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Reservoir-based limiter with continuous refill. Use this when you want burst tolerance and smoother
            throughput.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className={shellCardClassName}>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
            <StatCard label="Max Capacity" value={formatAmount(maxCapacity, true)} />
            <StatCard label="Available" value={formatAmount(liveAvailableCapacity, true)} />
            <StatCard label="Refill / Min" value={formatAmount(refillPerMinute, true)} />
            <StatCard label="Time To Full" value={formatDuration(liveSecondsUntilFull)} />
          </div>
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="rounded-2xl border border-default surface-muted p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Reservoir fill</span>
                <span>{formatPercent(liveAvailableCapacity, maxCapacity).toFixed(1)}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[color:var(--surface)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#111111_0%,#7a7a7a_100%)] dark:bg-[linear-gradient(90deg,#ffffff_0%,#7a7a7a_100%)]"
                  style={{ width: `${Math.min(formatPercent(liveAvailableCapacity, maxCapacity), 100)}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Available reflects the latest contract read. Only the wait labels count down locally between RPC
                refreshes.
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className={shellCardClassName}>
            <div className="p-5">
              <Eyebrow>Borrow Workflow</Eyebrow>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                The same guarded send flow is reused here, but the preflight result also tells you whether to wait for
                refill before trying again.
              </p>
              <div className="mt-4">
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
              </div>
            </div>
          </div>

          <PreviewCard
            title="Preflight Preview"
            headline={
              execution.hasFreshSimulation
                ? previewData[0]
                  ? `${formatAmount(previewData[2], true)} remains after send`
                  : `Need ${formatDuration(liveSecondsUntilAvailable)} more refill`
                : "Simulation output appears here"
            }
            detail={
              execution.hasFreshSimulation
                ? previewData[0]
                  ? "The current reservoir can cover this borrow right now. After confirmation, the remaining capacity will match this projection."
                  : "The borrow is larger than the current reservoir. Wait for the refill timer to catch up, or lower the requested amount."
                : "Run the simulation to check current available capacity and the exact refill wait for the amount you typed."
            }
          />
        </div>
      </div>
    </section>
  );
};

export const RateLimitDemo = () => {
  const [activeMechanism, setActiveMechanism] = useState<Mechanism>("bucketed");
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className={`${shellCardClassName} p-5 sm:p-6`}>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Eyebrow>DeFi Rate Limit Lab</Eyebrow>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl">
              Reference transaction flow for rate-limited borrows.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
              Compare the two limiter mechanisms with the same reusable execution workflow: preflight on the public
              client, explicit wallet prompt, receipt confirmation, and visible failure states.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link className={`${primaryButtonClassName} ${primaryButtonToneClassName}`} href="/debug">
                Open contract playground
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetaPill label="Network" value={targetNetwork.name} />
            <MetaPill label="Wallet" value={shortAddress(connectedAddress)} />
            <MetaPill label="Flow" value="simulate -> wallet -> confirm" />
            <MetaPill label="Model" value="single active mechanism" />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 lg:grid-cols-2">
        <TabButton
          active={activeMechanism === "bucketed"}
          icon={<ChartBarSquareIcon className="h-4 w-4" />}
          title="Bucketed window"
          subtitle="exact rolling-hour ceiling"
          onClick={() => setActiveMechanism("bucketed")}
        />
        <TabButton
          active={activeMechanism === "token"}
          icon={<ArrowPathRoundedSquareIcon className="h-4 w-4" />}
          title="Token bucket"
          subtitle="burst now, recover over time"
          onClick={() => setActiveMechanism("token")}
        />
      </section>

      <div className="mt-5">{activeMechanism === "bucketed" ? <BucketedPanel /> : <TokenPanel />}</div>
    </div>
  );
};
