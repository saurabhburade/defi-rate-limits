"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { memo, useState } from "react";
import { useReadContracts } from "wagmi";
import { DEFAULT_TOKEN_BUCKET_BORROW_AMOUNT } from "@/configs/constants";
import { getContract } from "@/configs/contracts";
import { getConfiguredChain } from "@/configs/wagmi/config";
import { useBorrowExecution } from "@/hooks/useBorrowExecution";
import { useLiveTokenBucketMetrics } from "@/hooks/useLiveTokenBucketMetrics";
import { formatAmount, formatDuration } from "@/utils/formatting";
import { TokenBucketRateLimiterSourceButton } from "@/views/shared/rate-limit/ContractSourceButton";
import { ExecutionTimeline } from "@/views/shared/rate-limit/ExecutionTimeline";
import { MetricStrip } from "@/views/shared/rate-limit/MetricStrip";
import { RateLimitPanelHeader } from "@/views/shared/rate-limit/RateLimitPanelHeader";
import { ReservoirMeter } from "@/views/shared/rate-limit/ReservoirMeter";
import { WorkflowPanel } from "@/views/shared/rate-limit/WorkflowPanel";

const tokenContract = getContract("TokenBucketRateLimiter", getConfiguredChain().id);

const TokenMetrics = memo(function TokenMetrics({
  availableCapacity,
  maxCapacity,
  refillRate,
  sampledAtMs,
  secondsUntilFull,
}: {
  availableCapacity?: bigint;
  maxCapacity?: bigint;
  refillRate?: bigint;
  sampledAtMs?: number;
  secondsUntilFull?: bigint;
}) {
  const { liveAvailableCapacity, liveSecondsUntilFull } = useLiveTokenBucketMetrics({
    animateAvailable: true,
    availableCapacity,
    maxCapacity,
    refillRate,
    sampledAtMs,
    secondsUntilFull,
  });
  const refillPerMinute = refillRate !== undefined ? refillRate * 60n : undefined;

  return (
    <>
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
    </>
  );
});

export const TokenPanel = () => {
  const [amount, setAmount] = useState(DEFAULT_TOKEN_BUCKET_BORROW_AMOUNT);
  const { openConnectModal } = useConnectModal();
  const execution = useBorrowExecution({
    contractName: "TokenBucketRateLimiter",
    amount,
    idleDetail:
      "Run the same simulation first so the app can prove the reservoir has enough capacity before wallet approval.",
  });

  const { data: tokenReads, dataUpdatedAt: tokenReadsUpdatedAt } = useReadContracts({
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
    },
  });

  const maxCapacity = tokenReads?.[0] as bigint | undefined;
  const refillRate = tokenReads?.[1] as bigint | undefined;
  const availableCapacity = tokenReads?.[2] as bigint | undefined;
  const secondsUntilFull = tokenReads?.[3] as bigint | undefined;
  const isBusy =
    execution.phase === "simulating" || execution.phase === "awaiting_wallet" || execution.phase === "confirming";
  const handleAmountChange = (value: string) => {
    execution.reset();
    setAmount(value);
  };

  return (
    <section className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
      <div className="min-w-0">
        <RateLimitPanelHeader fileName="TokenBucketRateLimiter.sol" title="Burst and recover">
          <TokenBucketRateLimiterSourceButton />
        </RateLimitPanelHeader>

        <TokenMetrics
          availableCapacity={availableCapacity}
          maxCapacity={maxCapacity}
          refillRate={refillRate}
          sampledAtMs={tokenReadsUpdatedAt || undefined}
          secondsUntilFull={secondsUntilFull}
        />
      </div>

      <WorkflowPanel
        amount={amount}
        amountPlaceholder={DEFAULT_TOKEN_BUCKET_BORROW_AMOUNT}
        busy={isBusy}
        canSubmit={execution.canSubmit}
        chainTag={execution.chainTag}
        onAmountChange={handleAmountChange}
        onConnectWallet={openConnectModal}
        onSend={execution.send}
        onSimulate={execution.simulate}
        simulateLabel="Validate"
        walletConnected={execution.isWalletConnected}
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
