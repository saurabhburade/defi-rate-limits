"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useReadContracts } from "wagmi";
import { DEFAULT_BUCKETED_BORROW_AMOUNT } from "@/configs/constants";
import { getContract } from "@/configs/contracts";
import { getConfiguredChain } from "@/configs/wagmi/config";
import { useBorrowExecution } from "@/hooks/useBorrowExecution";
import { formatAmount } from "@/utils/formatting";
import { BucketBars } from "@/views/shared/rate-limit/BucketBars";
import { BucketedRateLimiterSourceButton } from "@/views/shared/rate-limit/ContractSourceButton";
import { ExecutionTimeline } from "@/views/shared/rate-limit/ExecutionTimeline";
import { MetricStrip } from "@/views/shared/rate-limit/MetricStrip";
import { RateLimitPanelHeader } from "@/views/shared/rate-limit/RateLimitPanelHeader";
import { WorkflowPanel } from "@/views/shared/rate-limit/WorkflowPanel";

const bucketedContract = getContract("BucketedRateLimiter", getConfiguredChain().id);

export const BucketedPanel = () => {
  const [amount, setAmount] = useState(DEFAULT_BUCKETED_BORROW_AMOUNT);
  const { openConnectModal } = useConnectModal();
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
  const handleAmountChange = (value: string) => {
    execution.reset();
    setAmount(value);
  };

  return (
    <section className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
      <div className="min-w-0">
        <RateLimitPanelHeader fileName="BucketedRateLimiter.sol" title="Strict rolling window">
          <BucketedRateLimiterSourceButton />
        </RateLimitPanelHeader>

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
        amountPlaceholder={DEFAULT_BUCKETED_BORROW_AMOUNT}
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
