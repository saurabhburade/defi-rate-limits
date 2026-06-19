"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { safeParseAmount } from "~~/utils/rateLimit";

export const LOCAL_LIMIT = 1_000_000n;
export const LOCAL_NUM_BUCKETS = 6n;
export const LOCAL_MAX_CAPACITY = 1_000_000n;
export const LOCAL_REFILL_RATE = LOCAL_MAX_CAPACITY / 3600n;
export const LOCAL_BUCKETED_WINDOW_OPTIONS = [
  { label: "1 min", value: "1m", windowSeconds: 60n },
  { label: "1 hr", value: "1h", windowSeconds: 3600n },
] as const;
export type BucketedWindowPreset = (typeof LOCAL_BUCKETED_WINDOW_OPTIONS)[number]["value"];
export type BucketedWindowConfig = {
  bucketSize: bigint;
  label: string;
  numBuckets: bigint;
  value: BucketedWindowPreset;
  windowSeconds: bigint;
};
export const DEFAULT_BUCKETED_WINDOW_PRESET: BucketedWindowPreset = "1h";

const SIMULATE_DELAY_MS = 650;
const APPLY_DELAY_MS = 1800;
const MAX_UINT256 = (1n << 256n) - 1n;

type LocalStepKey = "input" | "simulate" | "apply";
type LocalPhase = "idle" | "simulating" | "simulated" | "applying" | "confirmed" | "failed";
type StepStatus = "pending" | "active" | "complete" | "error";

type ExecutionLog = {
  id: number;
  level: "info" | "success" | "error";
  message: string;
};

type LocalBorrowTraceLog = {
  level: ExecutionLog["level"];
  message: string;
};

type ExecutionStep = {
  key: LocalStepKey;
  label: string;
  detail: string;
  status: StepStatus;
};

type LocalStatus = {
  phase: LocalPhase;
  title: string;
  detail: string;
  errorMessage?: string;
};

type LocalBorrowPreview = {
  allowed: boolean;
  metricBefore: bigint;
  remainingAfter: bigint;
  reason?: string;
  secondsUntilAvailable?: bigint;
  trace?: LocalBorrowTraceLog[];
};

type LocalBorrowApplyResult = LocalBorrowPreview;

type BucketRecord = {
  index: bigint;
  amount: bigint;
};

export type BucketedLocalState = {
  buckets: BucketRecord[];
};

export type TokenBucketLocalState = {
  capacity: bigint;
  lastUpdate: number;
};

const sleep = (durationMs: number) => new Promise(resolve => window.setTimeout(resolve, durationMs));

const nowSeconds = () => Math.floor(Date.now() / 1000);

const ceilDiv = (value: bigint, divisor: bigint) => (value + divisor - 1n) / divisor;

const formatUnits = (value: bigint) => `${value.toLocaleString("en-US")} units`;

const formatSeconds = (seconds: bigint) => `${seconds.toLocaleString("en-US")}s`;

const formatBucketDuration = (seconds: bigint) => {
  if (seconds >= 3600n && seconds % 3600n === 0n) return `${(seconds / 3600n).toString()}h`;
  if (seconds >= 60n && seconds % 60n === 0n) return `${(seconds / 60n).toString()}m`;
  return `${seconds.toString()}s`;
};

export const getBucketedLocalWindowConfig = (
  preset: BucketedWindowPreset = DEFAULT_BUCKETED_WINDOW_PRESET,
): BucketedWindowConfig => {
  const option =
    LOCAL_BUCKETED_WINDOW_OPTIONS.find(windowOption => windowOption.value === preset) ??
    LOCAL_BUCKETED_WINDOW_OPTIONS[LOCAL_BUCKETED_WINDOW_OPTIONS.length - 1];

  return {
    ...option,
    bucketSize: option.windowSeconds / LOCAL_NUM_BUCKETS,
    numBuckets: LOCAL_NUM_BUCKETS,
  };
};

export const LOCAL_BUCKET_SIZE_SECONDS = getBucketedLocalWindowConfig().bucketSize;

export const useNowSeconds = () => {
  const [currentNowSeconds, setCurrentNowSeconds] = useState(nowSeconds);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentNowSeconds(nowSeconds()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return currentNowSeconds;
};

export const createInitialBucketedLocalState = (
  config: BucketedWindowConfig = getBucketedLocalWindowConfig(),
): BucketedLocalState => ({
  buckets: Array.from({ length: Number(config.numBuckets) }, () => ({ index: 0n, amount: 0n })),
});

export const createInitialTokenBucketLocalState = (): TokenBucketLocalState => ({
  capacity: LOCAL_MAX_CAPACITY,
  lastUpdate: nowSeconds(),
});

export const getBucketedLocalCurrentBucketId = (
  currentNowSeconds: number,
  config: BucketedWindowConfig = getBucketedLocalWindowConfig(),
) => BigInt(currentNowSeconds) / config.bucketSize;

export const getBucketedLocalWindowDuration = (config: BucketedWindowConfig = getBucketedLocalWindowConfig()) =>
  config.bucketSize * config.numBuckets;

const getBucketedLocalOldestActiveBucket = (
  currentIndex: bigint,
  config: BucketedWindowConfig = getBucketedLocalWindowConfig(),
) => {
  const activeWindow = config.numBuckets - 1n;
  return currentIndex > activeWindow ? currentIndex - activeWindow : 0n;
};

const getBucketedLocalAmountAt = (
  state: BucketedLocalState,
  bucketIndex: bigint,
  config: BucketedWindowConfig = getBucketedLocalWindowConfig(),
) => {
  const bucket = state.buckets[Number(bucketIndex % config.numBuckets)];
  return bucket?.index === bucketIndex ? bucket.amount : 0n;
};

export const getBucketedLocalWindowUsage = (
  state: BucketedLocalState,
  currentNowSeconds: number,
  config: BucketedWindowConfig = getBucketedLocalWindowConfig(),
) => {
  const currentIndex = getBucketedLocalCurrentBucketId(currentNowSeconds, config);
  let used = 0n;
  const oldestIndex = getBucketedLocalOldestActiveBucket(currentIndex, config);

  for (let bucketIndex = oldestIndex; bucketIndex <= currentIndex; bucketIndex += 1n) {
    used += getBucketedLocalAmountAt(state, bucketIndex, config);
  }

  return used;
};

export const getBucketedLocalRemainingCapacity = (
  state: BucketedLocalState,
  currentNowSeconds: number,
  config: BucketedWindowConfig = getBucketedLocalWindowConfig(),
) => LOCAL_LIMIT - getBucketedLocalWindowUsage(state, currentNowSeconds, config);

export const getBucketedLocalRecentBuckets = (
  state: BucketedLocalState,
  currentNowSeconds: number,
  config: BucketedWindowConfig = getBucketedLocalWindowConfig(),
) => {
  const currentIndex = getBucketedLocalCurrentBucketId(currentNowSeconds, config);
  const oldestIndex = getBucketedLocalOldestActiveBucket(currentIndex, config);
  const bucketIndices = Array.from({ length: Number(config.numBuckets) }, (_, index) => oldestIndex + BigInt(index));
  const amounts = bucketIndices.map(bucketIndex => getBucketedLocalAmountAt(state, bucketIndex, config));

  return { amounts, bucketIndices };
};

export const getBucketedLocalSnapshot = (
  state: BucketedLocalState,
  currentNowSeconds: number,
  config: BucketedWindowConfig = getBucketedLocalWindowConfig(),
) => {
  const currentIndex = getBucketedLocalCurrentBucketId(currentNowSeconds, config);
  const windowUsage = getBucketedLocalWindowUsage(state, currentNowSeconds, config);
  const remainingCapacity = getBucketedLocalRemainingCapacity(state, currentNowSeconds, config);
  const { amounts, bucketIndices } = getBucketedLocalRecentBuckets(state, currentNowSeconds, config);

  return {
    bucketIndices,
    bucketSize: config.bucketSize,
    currentBucket: currentIndex,
    limit: LOCAL_LIMIT,
    numBuckets: config.numBuckets,
    recentBuckets: amounts,
    remainingCapacity,
    windowDuration: getBucketedLocalWindowDuration(config),
    windowUsage,
  };
};

export const previewBucketedLocalBorrow = (
  state: BucketedLocalState,
  amount: bigint,
  currentNowSeconds: number,
  config: BucketedWindowConfig = getBucketedLocalWindowConfig(),
): LocalBorrowPreview => {
  const snapshot = getBucketedLocalSnapshot(state, currentNowSeconds, config);
  const available = snapshot.remainingCapacity;
  const trace: LocalBorrowTraceLog[] = [
    {
      level: "info",
      message: `Rolling-window check at bucket ${snapshot.currentBucket.toString()}: ${formatUnits(
        snapshot.windowUsage,
      )} used, ${formatUnits(available)} remaining.`,
    },
  ];

  if (amount === 0n) {
    return {
      allowed: false,
      metricBefore: snapshot.windowUsage,
      reason: "Enter a positive whole-number amount.",
      remainingAfter: available,
      trace,
    };
  }

  if (amount > available) {
    return {
      allowed: false,
      metricBefore: snapshot.windowUsage,
      reason: `Rate limited: requested ${amount.toLocaleString("en-US")} units with ${available.toLocaleString(
        "en-US",
      )} units available in the rolling window.`,
      remainingAfter: available,
      trace,
    };
  }

  return {
    allowed: true,
    metricBefore: snapshot.windowUsage,
    remainingAfter: available - amount,
    trace: [
      ...trace,
      {
        level: "info",
        message: `Preview passes: applying ${formatUnits(amount)} would leave ${formatUnits(
          available - amount,
        )} in the active rolling window.`,
      },
    ],
  };
};

export const applyBucketedLocalBorrow = (
  state: BucketedLocalState,
  amount: bigint,
  currentNowSeconds: number,
  config: BucketedWindowConfig = getBucketedLocalWindowConfig(),
): LocalBorrowApplyResult & { state?: BucketedLocalState } => {
  const preview = previewBucketedLocalBorrow(state, amount, currentNowSeconds, config);
  if (!preview.allowed) return preview;

  const currentIndex = getBucketedLocalCurrentBucketId(currentNowSeconds, config);
  const slot = Number(currentIndex % config.numBuckets);
  const currentBucket = state.buckets[slot];
  const currentSlotAmount = currentBucket?.index === currentIndex ? currentBucket.amount : 0n;
  const nextBuckets =
    state.buckets.length === Number(config.numBuckets)
      ? state.buckets.map(bucket => ({ ...bucket }))
      : createInitialBucketedLocalState(config).buckets;

  nextBuckets[slot] = {
    index: currentIndex,
    amount: currentSlotAmount + amount,
  };

  return {
    ...preview,
    state: { buckets: nextBuckets },
    trace: [
      ...(preview.trace ?? []),
      {
        level: "info",
        message: `Apply writes to the current ${formatBucketDuration(config.bucketSize)} bucket slot: ${formatUnits(
          currentSlotAmount,
        )} -> ${formatUnits(currentSlotAmount + amount)}.`,
      },
    ],
  };
};

export const getTokenBucketAvailableCapacity = (state: TokenBucketLocalState, currentNowSeconds: number) => {
  if (state.capacity >= LOCAL_MAX_CAPACITY) return LOCAL_MAX_CAPACITY;

  const elapsed = BigInt(Math.max(0, currentNowSeconds - state.lastUpdate));
  if (elapsed === 0n) return state.capacity;

  const missing = LOCAL_MAX_CAPACITY - state.capacity;
  const secondsToFull = ceilDiv(missing, LOCAL_REFILL_RATE);
  if (elapsed >= secondsToFull) return LOCAL_MAX_CAPACITY;

  return state.capacity + elapsed * LOCAL_REFILL_RATE;
};

export const getTokenBucketSecondsUntilFull = (state: TokenBucketLocalState, currentNowSeconds: number) => {
  const available = getTokenBucketAvailableCapacity(state, currentNowSeconds);
  if (available >= LOCAL_MAX_CAPACITY) return 0n;

  return ceilDiv(LOCAL_MAX_CAPACITY - available, LOCAL_REFILL_RATE);
};

export const getTokenBucketSecondsUntilAvailable = (
  state: TokenBucketLocalState,
  amount: bigint,
  currentNowSeconds: number,
) => {
  const available = getTokenBucketAvailableCapacity(state, currentNowSeconds);
  if (amount === 0n || amount <= available) return 0n;
  if (amount > LOCAL_MAX_CAPACITY) return MAX_UINT256;

  return ceilDiv(amount - available, LOCAL_REFILL_RATE);
};

export const getTokenBucketLocalSnapshot = (state: TokenBucketLocalState, currentNowSeconds: number) => ({
  availableCapacity: getTokenBucketAvailableCapacity(state, currentNowSeconds),
  capacity: state.capacity,
  lastUpdate: state.lastUpdate,
  maxCapacity: LOCAL_MAX_CAPACITY,
  refillRate: LOCAL_REFILL_RATE,
  secondsUntilFull: getTokenBucketSecondsUntilFull(state, currentNowSeconds),
});

const getTokenBucketRefillTrace = (
  state: TokenBucketLocalState,
  currentNowSeconds: number,
  available: bigint,
): LocalBorrowTraceLog[] => {
  const elapsed = BigInt(Math.max(0, currentNowSeconds - state.lastUpdate));

  if (elapsed === 0n) {
    return [
      {
        level: "info",
        message: `Continuous refill check: no elapsed time since the last commit; live capacity is ${formatUnits(
          available,
        )}.`,
      },
    ];
  }

  if (state.capacity >= LOCAL_MAX_CAPACITY) {
    return [
      {
        level: "info",
        message: `Continuous refill check: ${formatSeconds(elapsed)} elapsed, but capacity was already full at ${formatUnits(
          LOCAL_MAX_CAPACITY,
        )}.`,
      },
    ];
  }

  const uncappedRefill = elapsed * LOCAL_REFILL_RATE;
  const appliedRefill = available - state.capacity;
  const cappedMessage = appliedRefill < uncappedRefill ? " and capped at the max reservoir" : "";

  return [
    {
      level: "info",
      message: `Continuous refill check: ${formatSeconds(elapsed)} elapsed at ${formatUnits(
        LOCAL_REFILL_RATE,
      )}/s, adding ${formatUnits(appliedRefill)}${cappedMessage}.`,
    },
  ];
};

export const previewTokenBucketLocalBorrow = (
  state: TokenBucketLocalState,
  amount: bigint,
  currentNowSeconds: number,
): LocalBorrowPreview => {
  const available = getTokenBucketAvailableCapacity(state, currentNowSeconds);
  const trace = getTokenBucketRefillTrace(state, currentNowSeconds, available);

  if (amount === 0n) {
    return {
      allowed: false,
      metricBefore: available,
      reason: "Enter a positive whole-number amount.",
      remainingAfter: available,
      secondsUntilAvailable: 0n,
      trace,
    };
  }

  if (amount > LOCAL_MAX_CAPACITY) {
    return {
      allowed: false,
      metricBefore: available,
      reason: `Exceeds burst capacity: requested ${amount.toLocaleString("en-US")} units above the ${LOCAL_MAX_CAPACITY.toLocaleString(
        "en-US",
      )} unit ceiling.`,
      remainingAfter: available,
      secondsUntilAvailable: MAX_UINT256,
      trace,
    };
  }

  if (amount > available) {
    return {
      allowed: false,
      metricBefore: available,
      reason: `Rate limited: requested ${amount.toLocaleString("en-US")} units with ${available.toLocaleString(
        "en-US",
      )} units currently available.`,
      remainingAfter: available,
      secondsUntilAvailable: getTokenBucketSecondsUntilAvailable(state, amount, currentNowSeconds),
      trace,
    };
  }

  return {
    allowed: true,
    metricBefore: available,
    remainingAfter: available - amount,
    secondsUntilAvailable: 0n,
    trace: [
      ...trace,
      {
        level: "info",
        message: `Preview passes: applying ${formatUnits(amount)} would leave ${formatUnits(
          available - amount,
        )} in the live token bucket.`,
      },
    ],
  };
};

export const applyTokenBucketLocalBorrow = (
  state: TokenBucketLocalState,
  amount: bigint,
  currentNowSeconds: number,
): LocalBorrowApplyResult & { state?: TokenBucketLocalState } => {
  const preview = previewTokenBucketLocalBorrow(state, amount, currentNowSeconds);
  if (!preview.allowed) return preview;

  return {
    ...preview,
    state: {
      capacity: preview.remainingAfter,
      lastUpdate: currentNowSeconds,
    },
    trace: [
      ...(preview.trace ?? []),
      {
        level: "info",
        message: `Apply consumes ${formatUnits(amount)} from continuously refilled capacity ${formatUnits(
          preview.metricBefore,
        )}, then stores ${formatUnits(preview.remainingAfter)} as the new cached capacity.`,
      },
    ],
  };
};

const statusByPhase = (phase: LocalPhase, idleDetail: string, errorMessage: string | null): LocalStatus => {
  switch (phase) {
    case "simulating":
      return {
        phase,
        title: "Running local simulation",
        detail: "The page is checking the borrow against the in-memory limiter state.",
      };
    case "simulated":
      return {
        phase,
        title: "Simulation passed",
        detail: "The borrow fits the local limiter state. Apply it to mutate this page state.",
      };
    case "applying":
      return {
        phase,
        title: "Applying local borrow",
        detail: "The page is holding a short pending state before committing the local borrow.",
      };
    case "confirmed":
      return {
        phase,
        title: "Local borrow applied",
        detail: "The in-memory limiter state was updated without a wallet prompt or transaction.",
      };
    case "failed":
      return {
        phase,
        title: "Simulation failed",
        detail: errorMessage || "The local borrow could not be applied.",
        errorMessage: errorMessage || undefined,
      };
    default:
      return {
        phase,
        title: "Ready",
        detail: idleDetail,
      };
  }
};

export const useLocalBorrowExecution = ({
  amount,
  applyBorrow,
  idleDetail,
  previewBorrow,
  resetKey,
}: {
  amount: string;
  applyBorrow: (amount: bigint, currentNowSeconds: number) => LocalBorrowApplyResult;
  idleDetail: string;
  previewBorrow: (amount: bigint, currentNowSeconds: number) => LocalBorrowPreview;
  resetKey: number;
}) => {
  const parsedAmount = useMemo(() => safeParseAmount(amount), [amount]);
  const amountKey = parsedAmount?.toString() ?? "";
  const operationIdRef = useRef(0);

  const [phase, setPhase] = useState<LocalPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<LocalStepKey | null>(null);
  const [lastSimulatedAmountKey, setLastSimulatedAmountKey] = useState("");
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  const busy = phase === "simulating" || phase === "applying";

  const appendLog = useCallback((level: ExecutionLog["level"], message: string) => {
    setLogs(current => [...current, { id: Date.now() + current.length, level, message }]);
  }, []);

  const appendTraceLogs = useCallback(
    (trace: LocalBorrowTraceLog[] | undefined) => {
      trace?.forEach(log => appendLog(log.level, log.message));
    },
    [appendLog],
  );

  const fail = useCallback(
    (step: LocalStepKey, message: string) => {
      setPhase("failed");
      setFailedStep(step);
      setErrorMessage(message);
      appendLog("error", message);
    },
    [appendLog],
  );

  useEffect(() => {
    return () => {
      operationIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    operationIdRef.current += 1;
    setPhase("idle");
    setErrorMessage(null);
    setFailedStep(null);
    setLastSimulatedAmountKey("");
    setLogs([]);
  }, [amountKey, resetKey]);

  const startOperation = () => {
    operationIdRef.current += 1;
    return operationIdRef.current;
  };

  const validateAmount = useCallback(() => {
    if (parsedAmount === undefined) {
      setLogs([]);
      fail("input", "Input validation failed: enter a positive whole-number amount.");
      return undefined;
    }

    return parsedAmount;
  }, [fail, parsedAmount]);

  const simulate = useCallback(async () => {
    const operationId = startOperation();
    const validatedAmount = validateAmount();
    if (validatedAmount === undefined) return null;

    setPhase("simulating");
    setErrorMessage(null);
    setFailedStep(null);
    setLogs([
      {
        id: Date.now(),
        level: "info",
        message: `Checking local preview for ${validatedAmount.toLocaleString("en-US")} units.`,
      },
    ]);

    await sleep(SIMULATE_DELAY_MS);
    if (operationId !== operationIdRef.current) return null;

    const preview = previewBorrow(validatedAmount, nowSeconds());
    appendTraceLogs(preview.trace);
    if (!preview.allowed) {
      fail("simulate", preview.reason || "Local simulation rejected the borrow.");
      return preview;
    }

    setPhase("simulated");
    setLastSimulatedAmountKey(validatedAmount.toString());
    appendLog(
      "success",
      `Simulation passed with ${preview.remainingAfter.toLocaleString("en-US")} units remaining after the borrow.`,
    );
    return preview;
  }, [appendLog, appendTraceLogs, fail, previewBorrow, validateAmount]);

  const apply = useCallback(async () => {
    const operationId = startOperation();
    const validatedAmount = validateAmount();
    if (validatedAmount === undefined) return null;

    setPhase("applying");
    setErrorMessage(null);
    setFailedStep(null);
    setLogs([
      {
        id: Date.now(),
        level: "info",
        message: `Local borrow queued for ${validatedAmount.toLocaleString("en-US")} units.`,
      },
      {
        id: Date.now() + 1,
        level: "info",
        message: "Waiting for the local commit point, then rechecking limiter state before mutation.",
      },
    ]);

    await sleep(APPLY_DELAY_MS);
    if (operationId !== operationIdRef.current) return null;

    const result = applyBorrow(validatedAmount, nowSeconds());
    appendTraceLogs(result.trace);
    if (!result.allowed) {
      fail("apply", result.reason || "Local borrow was rejected at commit time.");
      return result;
    }

    setPhase("confirmed");
    setLastSimulatedAmountKey(validatedAmount.toString());
    appendLog(
      "success",
      `Local borrow applied with ${result.remainingAfter.toLocaleString("en-US")} units remaining after commit.`,
    );
    return result;
  }, [appendLog, appendTraceLogs, applyBorrow, fail, validateAmount]);

  const steps: ExecutionStep[] = [
    {
      key: "input",
      label: "Validate input",
      detail:
        parsedAmount !== undefined
          ? `Display amount ${parsedAmount.toLocaleString("en-US")} maps to local raw units.`
          : "Require a positive whole-number amount before local simulation.",
      status: failedStep === "input" ? "error" : parsedAmount !== undefined ? "complete" : "pending",
    },
    {
      key: "simulate",
      label: "Preview local state",
      detail: "Run the same limiter checks without mutating local state.",
      status:
        failedStep === "simulate"
          ? "error"
          : phase === "simulating"
            ? "active"
            : phase === "simulated" || phase === "applying" || phase === "confirmed"
              ? "complete"
              : "pending",
    },
    {
      key: "apply",
      label: "Apply local borrow",
      detail: "Commit the borrow into this page's in-memory limiter state.",
      status:
        failedStep === "apply"
          ? "error"
          : phase === "applying"
            ? "active"
            : phase === "confirmed"
              ? "complete"
              : "pending",
    },
  ];

  return {
    amountKey,
    apply,
    busy,
    canSubmit: !busy,
    hasFreshSimulation: lastSimulatedAmountKey === amountKey && (phase === "simulated" || phase === "confirmed"),
    logs,
    parsedAmount,
    phase,
    simulate,
    status: statusByPhase(phase, idleDetail, errorMessage),
    steps,
  };
};
