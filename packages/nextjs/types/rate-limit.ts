export type StepStatus = "pending" | "active" | "complete" | "error";

export type ExecutionLog = {
  id: number;
  level: "info" | "success" | "error";
  message: string;
};

export type LocalBorrowTraceLog = {
  level: ExecutionLog["level"];
  message: string;
};

export type LocalStepKey = "input" | "simulate" | "apply";
export type LocalPhase = "idle" | "simulating" | "simulated" | "applying" | "confirmed" | "failed";

export type ExecutionStep = {
  key: LocalStepKey;
  label: string;
  detail: string;
  status: StepStatus;
};

export type LocalStatus = {
  phase: LocalPhase;
  title: string;
  detail: string;
  errorMessage?: string;
};

export type LocalBorrowPreview = {
  allowed: boolean;
  metricBefore: bigint;
  remainingAfter: bigint;
  reason?: string;
  secondsUntilAvailable?: bigint;
  trace?: LocalBorrowTraceLog[];
};

export type LocalBorrowApplyResult = LocalBorrowPreview;

export type BucketedWindowPreset = "1m" | "1h";

export type BucketedWindowConfig = {
  bucketSize: bigint;
  label: string;
  numBuckets: bigint;
  value: BucketedWindowPreset;
  windowSeconds: bigint;
};

export type BucketRecord = {
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
