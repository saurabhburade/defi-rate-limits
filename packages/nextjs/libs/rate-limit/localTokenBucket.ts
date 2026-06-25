import { MAX_UINT256, ceilDiv, formatSeconds, formatUnits } from "@/libs/rate-limit/localSimulationTrace";
import {
  LocalBorrowApplyResult,
  LocalBorrowPreview,
  LocalBorrowTraceLog,
  TokenBucketLocalState,
} from "@/types/rate-limit";

export const LOCAL_MAX_CAPACITY = 1_000_000n;
export const LOCAL_REFILL_RATE = LOCAL_MAX_CAPACITY / 3600n;

export const createInitialTokenBucketLocalState = (): TokenBucketLocalState => ({
  capacity: LOCAL_MAX_CAPACITY,
  lastUpdate: Math.floor(Date.now() / 1000),
});

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
