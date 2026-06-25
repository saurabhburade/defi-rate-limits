"use client";

import { formatAmount, formatPercent } from "@/libs/rate-limit/formatting";

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100);

const formatBucketDurationLabel = (seconds: number) => {
  if (seconds >= 3600 && seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
};

const CircularProgress = ({
  label,
  size = 96,
  strokeWidth = 8,
  value,
  srLabel,
}: {
  label: React.ReactNode;
  size?: number;
  strokeWidth?: number;
  value: number;
  srLabel: string;
}) => {
  const normalizedValue = clampPercent(value);
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * ((100 - normalizedValue) / 100);

  return (
    <div aria-label={srLabel} className="relative mx-auto shrink-0" role="img" style={{ height: size, width: size }}>
      <svg
        aria-hidden="true"
        className="absolute inset-0 -rotate-90"
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
      >
        <circle
          className="stroke-[color:var(--surface)]"
          cx={center}
          cy={center}
          fill="transparent"
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="stroke-[color:var(--primary)] transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          cx={center}
          cy={center}
          fill="transparent"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
        {label}
      </div>
    </div>
  );
};

export const BucketBars = ({
  values,
  limit,
  bucketSize,
}: {
  values: bigint[];
  limit?: bigint;
  bucketSize?: bigint;
}) => {
  const bucketSeconds = bucketSize ? Number(bucketSize) : 600;
  const bucketLabel = formatBucketDurationLabel(bucketSeconds);
  const visibleValues =
    values.length >= 6 ? values.slice(-6) : [...Array.from({ length: 6 - values.length }, () => 0n), ...values];

  return (
    <div className="pt-10">
      <div className="flex items-baseline gap-3">
        <p className="text-base font-semibold text-muted-foreground">Recent buckets</p>
        <span className="font-mono text-sm text-muted-foreground/60">{bucketLabel} slots</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {visibleValues.map((amount, index) => {
          const percent = clampPercent(formatPercent(amount, limit));
          const distance = visibleValues.length - 1 - index;
          const label = distance === 0 ? "Now" : `-${formatBucketDurationLabel(distance * bucketSeconds)}`;
          const percentLabel = `${Math.round(percent)}%`;
          const amountLabel = formatAmount(amount, true);

          return (
            <div
              className="rounded-lg border border-default bg-[color:var(--surface-muted)] px-3 py-4"
              key={`${label}-${index}`}
            >
              <CircularProgress
                label={percentLabel}
                srLabel={`${label}: ${amountLabel}, ${percentLabel} of the rolling-window limit`}
                value={percent}
              />
              <div className="mt-3 min-w-0 text-center">
                <p className="text-sm font-medium text-muted-foreground/70">{label}</p>
                <p className="mt-1 truncate font-mono text-xs text-muted-foreground" title={`${label}: ${amountLabel}`}>
                  {amountLabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
