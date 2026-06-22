"use client";

import { BorrowFlowCard, buttonBaseClassName, secondaryButtonClassName } from "~~/components/rate-limit/ui";
import { formatAmount, formatPercent } from "~~/utils/rateLimit";

export type Mechanism = "bucketed" | "token";

const AmountValue = ({ value }: { value: string }) => {
  const [amount, ...unitParts] = value.split(" ");
  const unit = unitParts.join(" ");

  return (
    <p className="mt-2 flex items-end gap-1.5 text-2xl font-semibold tracking-[-0.03em] text-foreground">
      <span>{amount}</span>
      {unit ? <span className="pb-0.5 text-sm font-medium tracking-normal text-muted-foreground">{unit}</span> : null}
    </p>
  );
};

export const MetricStrip = ({ items }: { items: Array<{ label: string; value: string }> }) => {
  const columnClassName = items.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3";

  return (
    <div className={`grid gap-y-6 ${columnClassName}`}>
      {items.map((item, index) => (
        <div key={item.label} className={index === 0 ? "" : "sm:border-l sm:border-default sm:pl-6"}>
          <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
          <AmountValue value={item.value} />
        </div>
      ))}
    </div>
  );
};

export const MechanismButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    className={`${buttonBaseClassName} px-4 ${
      active
        ? "bg-[color:var(--surface)] text-foreground shadow-[0_2px_12px_rgb(0_0_0/0.08)]"
        : "text-muted-foreground hover:text-foreground"
    }`}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
);

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

export const ReservoirMeter = ({ value, total }: { value?: bigint; total?: bigint }) => {
  const percent = Math.min(formatPercent(value, total), 100);

  return (
    <div className="pt-10">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-base font-semibold text-muted-foreground">Reservoir fill</p>
        <span className="font-mono text-sm text-muted-foreground/60">{percent.toFixed(1)}%</span>
      </div>
      <div className="mt-5 rounded-xl bg-[color:var(--surface-muted)] p-3">
        <div className="h-3 overflow-hidden rounded-full bg-[color:var(--surface)]">
          <div
            className="h-full rounded-full bg-[color:var(--primary)] transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export const WorkflowPanel = ({
  amount,
  amountPlaceholder,
  busy,
  busyButton,
  busyLabel,
  canSubmit,
  chainTag,
  onAmountChange,
  onReset,
  onSimulate,
  onSend,
  sendLabel,
  simulateBusyLabel,
  simulateLabel,
  timeline,
}: {
  amount: string;
  amountPlaceholder: string;
  busy: boolean;
  busyButton?: "simulate" | "send";
  busyLabel?: string;
  canSubmit: boolean;
  chainTag?: string;
  onAmountChange: (value: string) => void;
  onReset?: () => void;
  onSimulate: () => Promise<unknown>;
  onSend: () => Promise<unknown>;
  sendLabel?: string;
  simulateBusyLabel?: string;
  simulateLabel?: string;
  timeline: React.ReactNode;
}) => (
  <aside className="rounded-2xl bg-[color:var(--surface-muted)] px-5 py-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Borrow workflow</h3>
        {chainTag ? (
          <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-default bg-[color:var(--surface)] px-2.5 font-mono text-xs font-semibold text-muted-foreground">
            {chainTag}
          </span>
        ) : null}
      </div>
      {onReset ? (
        <button className={secondaryButtonClassName} onClick={onReset} type="button">
          Reset
        </button>
      ) : null}
    </div>
    <div className="mt-5">
      <BorrowFlowCard
        amount={amount}
        amountPlaceholder={amountPlaceholder}
        busy={busy}
        busyButton={busyButton}
        busyLabel={busyLabel}
        canSubmit={canSubmit}
        onAmountChange={onAmountChange}
        onSend={onSend}
        onSimulate={onSimulate}
        sendLabel={sendLabel}
        simulateBusyLabel={simulateBusyLabel}
        simulateLabel={simulateLabel}
        timeline={timeline}
      />
    </div>
  </aside>
);
