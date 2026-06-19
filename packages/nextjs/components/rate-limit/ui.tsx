"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { Spinner } from "~~/components/ui/spinner";

type StepStatus = "pending" | "active" | "complete" | "error";
type ExecutionLog = {
  id: number;
  level: "info" | "success" | "error";
  message: string;
};

export const shellCardClassName = "rounded-[28px] bg-[color:var(--surface-muted)]";
export const inputClassName =
  "min-w-0 h-10 w-full rounded-xl border border-default bg-[color:var(--surface)] px-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[color:var(--ring)] focus:ring-2 focus:ring-[color:var(--ring)]";
export const buttonBaseClassName =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium outline-none transition-all focus-visible:border-[color:var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)] disabled:pointer-events-none disabled:opacity-50";
export const secondaryButtonClassName = `${buttonBaseClassName} border border-default bg-[color:var(--surface)] text-foreground hover:bg-[color:var(--surface-muted)]`;
export const primaryButtonClassName = `${buttonBaseClassName} border`;
export const primaryButtonToneClassName =
  "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:border-[color:var(--primary-hover)] hover:bg-[color:var(--primary-hover)]";
export const ghostButtonClassName = `${buttonBaseClassName} px-3 text-muted-foreground hover:bg-[color:var(--surface-muted)] hover:text-foreground`;

export const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-medium text-muted-foreground">{children}</p>
);

export const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-default surface p-3">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 text-base font-semibold text-foreground sm:text-lg">{value}</p>
  </div>
);

export const ValueCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-default surface p-3">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">{value}</p>
  </div>
);

export const MetaPill = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border border-default surface px-3 py-2">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
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
    className={`min-w-0 rounded-full px-3 py-2 text-left text-sm font-medium transition-all outline-none focus-visible:border-[color:var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)] disabled:pointer-events-none disabled:opacity-50 ${
      active
        ? "bg-[color:var(--surface)] text-foreground shadow-sm"
        : "text-muted-foreground hover:bg-[color:var(--surface)] hover:text-foreground"
    }`}
    onClick={onClick}
    type="button"
  >
    {title ? (
      <div className="flex min-w-0 items-center gap-2">
        {icon ? <div className="shrink-0 text-current">{icon}</div> : null}
        <div className="min-w-0">
          <p className="truncate font-medium">{title}</p>
          {subtitle ? <p className="mt-0.5 truncate text-xs text-current/70">{subtitle}</p> : null}
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
    className={`${buttonBaseClassName} border px-3 ${
      active
        ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
        : "border-default surface text-muted-foreground hover:text-foreground"
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
  <div className="rounded-lg border border-default surface p-4">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    <div className="mt-4">{children}</div>
  </div>
);

const stepStatusClassName: Record<StepStatus, string> = {
  pending: "border-default bg-[color:var(--surface)] text-muted-foreground",
  active: "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]",
  complete: "border-default bg-[color:var(--surface)] text-foreground",
  error: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
};

const logLevelClassName: Record<"info" | "success" | "error", string> = {
  info: "bg-[color:var(--surface-muted)] text-muted-foreground",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  error: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200",
};

const StatusLogAccordion = ({ logs }: { logs: ExecutionLog[] }) => {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="pt-1">
      <button
        aria-controls={contentId}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-lg py-1 text-left text-sm font-medium text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)]"
        onClick={() => setOpen(current => !current)}
        type="button"
      >
        <span>Status logs</span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-4 shrink-0 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        aria-hidden={!open}
        className={`grid overflow-hidden transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        id={contentId}
      >
        <div className="min-h-0">
          <div className="space-y-2 pt-3">
            {logs.map(log => (
              <div key={log.id} className="rounded-2xl bg-[color:var(--surface)] px-4 py-3 text-sm">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${logLevelClassName[log.level]}`}>
                  {log.level}
                </span>
                <p className="mt-2 leading-6 text-foreground/80">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExecutionTimeline = ({
  title,
  detail,
  steps,
  logs,
  txHash,
  explorerUrl,
}: {
  title: string;
  detail: string;
  steps: Array<{
    key: string;
    label: string;
    detail: string;
    status: StepStatus;
  }>;
  logs?: ExecutionLog[];
  txHash?: string;
  explorerUrl?: string;
}) => {
  const logCount = logs?.length ?? 0;
  const visibleSteps = steps.filter(step => step.status !== "pending");

  return (
    <div className="space-y-5">
      <p className="sr-only">
        {title}. {detail}
      </p>
      {txHash ? (
        <div className="border-b border-default pb-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-muted-foreground">{`${txHash.slice(0, 10)}...${txHash.slice(-8)}`}</span>
            {explorerUrl ? (
              <a
                className="font-medium text-foreground underline underline-offset-4"
                href={explorerUrl}
                rel="noreferrer"
                target="_blank"
              >
                Explorer
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-muted-foreground">Execution</span>
          <span className="text-sm text-muted-foreground">{logCount} logs</span>
        </div>

        <div className="space-y-3">
          {visibleSteps.map((step, index) => (
            <div key={step.key} className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${stepStatusClassName[step.status]}`}
              >
                {step.status === "active" ? (
                  <Spinner className="size-3.5" />
                ) : step.status === "complete" ? (
                  <>
                    <span className="sr-only">Complete</span>
                    <CheckIcon aria-hidden="true" className="size-3.5" />
                  </>
                ) : step.status === "error" ? (
                  <>
                    <span className="sr-only">Failed</span>
                    <XIcon aria-hidden="true" className="size-3.5" />
                  </>
                ) : (
                  index + 1
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{step.label}</p>
                <p className="sr-only">{step.detail}</p>
              </div>
            </div>
          ))}

          {logs && logs.length > 0 ? <StatusLogAccordion logs={logs} /> : null}
        </div>
      </div>
    </div>
  );
};

export const BorrowFlowCard = ({
  amount,
  onAmountChange,
  amountPlaceholder,
  onSimulate,
  onSend,
  canSubmit,
  busy,
  busyButton = "send",
  busyLabel = "Working",
  preview,
  sendLabel = "Send",
  simulateBusyLabel = "Simulating",
  simulateLabel = "Simulate",
  timeline,
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  amountPlaceholder: string;
  onSimulate: () => Promise<unknown>;
  onSend: () => Promise<unknown>;
  canSubmit: boolean;
  busy: boolean;
  busyButton?: "simulate" | "send";
  busyLabel?: string;
  preview?: React.ReactNode;
  sendLabel?: string;
  simulateBusyLabel?: string;
  simulateLabel?: string;
  timeline: React.ReactNode;
}) => (
  <div className="min-w-0 space-y-4">
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold text-muted-foreground">Borrow amount</span>
      <input
        className={inputClassName}
        inputMode="numeric"
        placeholder={amountPlaceholder}
        value={amount}
        onChange={event => onAmountChange(event.target.value)}
      />
    </label>

    <div className="grid gap-3 sm:grid-cols-2">
      <button
        className={`${secondaryButtonClassName} w-full`}
        disabled={busy || !canSubmit}
        onClick={() => {
          void onSimulate().catch(() => undefined);
        }}
        type="button"
      >
        {busy && busyButton === "simulate" ? (
          <>
            <Spinner className="size-3.5" />
            {simulateBusyLabel}
          </>
        ) : (
          simulateLabel
        )}
      </button>
      <button
        className={`${primaryButtonClassName} ${primaryButtonToneClassName} w-full`}
        disabled={busy || !canSubmit}
        onClick={() => {
          void onSend().catch(() => undefined);
        }}
        type="button"
      >
        {busy && busyButton === "send" ? (
          <>
            <Spinner className="size-3.5" />
            {busyLabel}
          </>
        ) : (
          sendLabel
        )}
      </button>
    </div>

    {preview}
    {timeline}
  </div>
);
