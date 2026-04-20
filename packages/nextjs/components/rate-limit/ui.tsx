"use client";

import Link from "next/link";

type StepStatus = "pending" | "active" | "complete" | "error";

export const shellCardClassName = "rounded-[24px] border border-default surface shadow-[0_18px_60px_rgba(0,0,0,0.08)]";
export const inputClassName =
  "min-w-0 w-full rounded-xl border border-default bg-[color:var(--surface-muted)] px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[color:var(--ring)]";
export const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl border border-default bg-[color:var(--surface-muted)] px-3 py-2 text-xs font-medium text-foreground transition hover:bg-[color:var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-60";
export const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
export const primaryButtonToneClassName =
  "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:border-[color:var(--primary-hover)] hover:bg-[color:var(--primary-hover)]";

export const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">{children}</p>
);

export const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-default surface-muted p-4">
    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">{value}</p>
  </div>
);

export const ValueCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-default surface-muted p-4">
    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">{value}</p>
  </div>
);

export const MetaPill = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-default surface-muted px-4 py-3">
    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    <p className="mt-1.5 text-sm font-medium text-foreground">{value}</p>
  </div>
);

export const TabButton = ({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active?: boolean;
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) => (
  <button
    className={`rounded-2xl border px-4 py-3 text-left transition ${
      active
        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
        : "border-default surface-muted"
    }`}
    onClick={onClick}
    type="button"
  >
    {title ? (
      <div className="flex items-center gap-3">
        {icon ? (
          <div className={`rounded-xl p-2 ${active ? "bg-white/12 dark:bg-black/8" : "surface"}`}>{icon}</div>
        ) : null}
        <div>
          <p className={`text-sm font-semibold ${active ? "text-current" : "text-foreground"}`}>{title}</p>
          {subtitle ? (
            <p className={`mt-1 text-xs ${active ? "text-current/70 dark:text-current/60" : "text-muted-foreground"}`}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    ) : null}
  </button>
);

export const CompactTabButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
      active
        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
        : "border-default surface-muted text-muted-foreground hover:text-foreground"
    }`}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
);

export const LinkButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link className={secondaryButtonClassName} href={href}>
    {children}
  </Link>
);

export const FieldCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-[20px] border border-default surface-muted p-4 sm:p-5">
    <p className="text-sm font-semibold text-foreground sm:text-base">{title}</p>
    <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
    <div className="mt-4">{children}</div>
  </div>
);

const stepStatusClassName: Record<StepStatus, string> = {
  pending: "border-default bg-[color:var(--surface)] text-muted-foreground",
  active: "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
  complete: "border-default bg-[color:var(--surface)] text-foreground",
  error: "border-red-500/30 bg-red-500/10 text-red-500 dark:text-red-300",
};

export const ExecutionTimeline = ({
  title,
  detail,
  steps,
  logs,
  txHash,
  explorerUrl,
  isSuccess,
  isError,
}: {
  title: string;
  detail: string;
  steps: Array<{ key: string; label: string; detail: string; status: StepStatus }>;
  logs?: Array<{ id: number; level: "info" | "success" | "error"; message: string }>;
  txHash?: string;
  explorerUrl?: string;
  isSuccess?: boolean;
  isError?: boolean;
}) => (
  <div className="rounded-2xl border border-default surface-muted p-4">
    <div
      className={`rounded-2xl border p-4 ${
        isError
          ? "border-red-500/30 bg-red-500/8"
          : isSuccess
            ? "border-emerald-500/20 bg-emerald-500/8"
            : "border-default bg-[color:var(--surface)]"
      }`}
    >
      <Eyebrow>{isError ? "Execution Failed" : isSuccess ? "Execution Confirmed" : "Execution Status"}</Eyebrow>
      <p className="mt-2 text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{detail}</p>
      {txHash ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted-foreground">{`${txHash.slice(0, 10)}...${txHash.slice(-8)}`}</span>
          {explorerUrl ? (
            <a
              className="text-foreground underline underline-offset-4"
              href={explorerUrl}
              rel="noreferrer"
              target="_blank"
            >
              View on explorer
            </a>
          ) : null}
        </div>
      ) : null}
    </div>

    <div className="mt-4 space-y-3">
      {steps.map((step, index) => (
        <div key={step.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${stepStatusClassName[step.status]}`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 ? <div className="mt-2 h-7 w-px bg-[color:var(--border)]" /> : null}
          </div>
          <div className="pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">{step.label}</p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] ${
                  stepStatusClassName[step.status]
                }`}
              >
                {step.status}
              </span>
            </div>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">{step.detail}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="mt-5 rounded-2xl border border-default bg-[color:var(--surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>Status Logs</Eyebrow>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {logs?.length ?? 0} entries
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {logs && logs.length > 0 ? (
          logs.map(log => (
            <div key={log.id} className="flex items-start gap-2 rounded-xl border border-default px-3 py-2 text-xs">
              <span
                className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] ${
                  log.level === "error"
                    ? "bg-red-500/10 text-red-500 dark:text-red-300"
                    : log.level === "success"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                      : "bg-[color:var(--surface-muted)] text-muted-foreground"
                }`}
              >
                {log.level}
              </span>
              <p className="leading-6 text-foreground/80">{log.message}</p>
            </div>
          ))
        ) : (
          <p className="text-xs leading-6 text-muted-foreground">
            No execution logs yet. Run simulate or send to populate the audit trail.
          </p>
        )}
      </div>
    </div>
  </div>
);

export const BorrowFlowCard = ({
  amount,
  onAmountChange,
  amountPlaceholder,
  onSimulate,
  onSend,
  canSubmit,
  busy,
  timeline,
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  amountPlaceholder: string;
  onSimulate: () => Promise<unknown>;
  onSend: () => Promise<unknown>;
  canSubmit: boolean;
  busy: boolean;
  timeline: React.ReactNode;
}) => (
  <div className="min-w-0 space-y-4">
    <label className="block min-w-0">
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Borrow Amount
      </span>
      <input
        className={inputClassName}
        inputMode="numeric"
        placeholder={amountPlaceholder}
        value={amount}
        onChange={event => onAmountChange(event.target.value)}
      />
    </label>

    <div className="grid gap-2 sm:grid-cols-2">
      <button
        className={`${secondaryButtonClassName} w-full`}
        disabled={busy || !canSubmit}
        onClick={() => {
          void onSimulate().catch(() => undefined);
        }}
        type="button"
      >
        Simulate first
      </button>
      <button
        className={`${primaryButtonClassName} ${primaryButtonToneClassName} w-full`}
        disabled={busy || !canSubmit}
        onClick={() => {
          void onSend().catch(() => undefined);
        }}
        type="button"
      >
        {busy ? "In progress..." : "Send transaction"}
      </button>
    </div>

    {timeline}
  </div>
);
