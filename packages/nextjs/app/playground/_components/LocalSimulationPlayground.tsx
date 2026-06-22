"use client";

import { useCallback, useMemo, useState } from "react";
import { AvatarComponent } from "@rainbow-me/rainbowkit";
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
import { ExecutionTimeline, inputClassName } from "~~/components/rate-limit/ui";
import {
  BucketedLocalState,
  BucketedWindowConfig,
  BucketedWindowPreset,
  DEFAULT_BUCKETED_WINDOW_PRESET,
  LOCAL_BUCKETED_WINDOW_OPTIONS,
  TokenBucketLocalState,
  applyBucketedLocalBorrow,
  applyTokenBucketLocalBorrow,
  createInitialBucketedLocalState,
  createInitialTokenBucketLocalState,
  getBucketedLocalSnapshot,
  getBucketedLocalWindowConfig,
  getTokenBucketLocalSnapshot,
  previewBucketedLocalBorrow,
  previewTokenBucketLocalBorrow,
  useLocalBorrowExecution,
  useNowSeconds,
} from "~~/hooks/rate-limit/useLocalRateLimitSimulation";
import { formatAmount, formatDuration } from "~~/utils/rateLimit";

const DEFAULT_BUCKETED_AMOUNT = "250000";
const DEFAULT_TOKEN_AMOUNT = "200000";

const BucketedWindowSelect = ({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (value: BucketedWindowPreset) => void;
  value: BucketedWindowPreset;
}) => (
  <label className="block min-w-0">
    <span className="mb-2 block text-sm font-semibold text-muted-foreground">Limit window</span>
    <select
      className={`${inputClassName} cursor-pointer appearance-none disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={disabled}
      onChange={event => onChange(event.target.value as BucketedWindowPreset)}
      value={value}
    >
      {LOCAL_BUCKETED_WINDOW_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const BucketedLocalPanel = ({
  amount,
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
        amountPlaceholder={DEFAULT_BUCKETED_AMOUNT}
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

const TokenLocalPanel = ({
  amount,
  currentNowSeconds,
  onAmountChange,
  onReset,
  resetKey,
  setTokenState,
  tokenState,
}: {
  amount: string;
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
        amountPlaceholder={DEFAULT_TOKEN_AMOUNT}
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

export const LocalSimulationPlayground = () => {
  const currentNowSeconds = useNowSeconds();
  const [activeMechanism, setActiveMechanism] = useState<Mechanism>("bucketed");
  const [bucketedWindowPreset, setBucketedWindowPreset] =
    useState<BucketedWindowPreset>(DEFAULT_BUCKETED_WINDOW_PRESET);
  const [bucketedState, setBucketedState] = useState(createInitialBucketedLocalState);
  const [tokenState, setTokenState] = useState(createInitialTokenBucketLocalState);
  const [bucketedAmount, setBucketedAmount] = useState(DEFAULT_BUCKETED_AMOUNT);
  const [tokenAmount, setTokenAmount] = useState(DEFAULT_TOKEN_AMOUNT);
  const [resetKey, setResetKey] = useState(0);
  const bucketedWindowConfig = useMemo(
    () => getBucketedLocalWindowConfig(bucketedWindowPreset),
    [bucketedWindowPreset],
  );

  const setBucketedLimitWindow = (nextPreset: BucketedWindowPreset) => {
    const nextConfig = getBucketedLocalWindowConfig(nextPreset);
    setBucketedWindowPreset(nextPreset);
    setBucketedState(createInitialBucketedLocalState(nextConfig));
    setResetKey(current => current + 1);
  };

  const resetPlayground = () => {
    setBucketedState(createInitialBucketedLocalState(bucketedWindowConfig));
    setTokenState(createInitialTokenBucketLocalState());
    setBucketedAmount(DEFAULT_BUCKETED_AMOUNT);
    setTokenAmount(DEFAULT_TOKEN_AMOUNT);
    setResetKey(current => current + 1);
  };

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

      <div className="mt-10">
        {activeMechanism === "bucketed" ? (
          <BucketedLocalPanel
            amount={bucketedAmount}
            bucketedState={bucketedState}
            currentNowSeconds={currentNowSeconds}
            onAmountChange={setBucketedAmount}
            onReset={resetPlayground}
            onWindowPresetChange={setBucketedLimitWindow}
            resetKey={resetKey}
            setBucketedState={setBucketedState}
            windowConfig={bucketedWindowConfig}
            windowPreset={bucketedWindowPreset}
          />
        ) : (
          <TokenLocalPanel
            amount={tokenAmount}
            currentNowSeconds={currentNowSeconds}
            onAmountChange={setTokenAmount}
            onReset={resetPlayground}
            resetKey={resetKey}
            setTokenState={setTokenState}
            tokenState={tokenState}
          />
        )}
      </div>
    </div>
  );
};
