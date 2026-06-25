import { formatBucketDuration, formatUnits } from "@/libs/rate-limit/localSimulationTrace";
import {
  BucketedLocalState,
  BucketedWindowConfig,
  BucketedWindowPreset,
  LocalBorrowApplyResult,
  LocalBorrowPreview,
  LocalBorrowTraceLog,
} from "@/types/rate-limit";

export const LOCAL_LIMIT = 1_000_000n;
export const LOCAL_NUM_BUCKETS = 6n;
export const LOCAL_BUCKETED_WINDOW_OPTIONS = [
  { label: "1 min", value: "1m", windowSeconds: 60n },
  { label: "1 hr", value: "1h", windowSeconds: 3600n },
] as const satisfies readonly { label: string; value: BucketedWindowPreset; windowSeconds: bigint }[];
export const DEFAULT_BUCKETED_WINDOW_PRESET: BucketedWindowPreset = "1h";

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

export const createInitialBucketedLocalState = (
  config: BucketedWindowConfig = getBucketedLocalWindowConfig(),
): BucketedLocalState => ({
  buckets: Array.from({ length: Number(config.numBuckets) }, () => ({ index: 0n, amount: 0n })),
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
