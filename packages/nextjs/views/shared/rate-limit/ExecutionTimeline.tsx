"use client";

import { useId, useState } from "react";
import { Spinner } from "@/components/common/Spinner";
import type { ExecutionLog, StepStatus } from "@/types/rate-limit";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";

const stepStatusClassName: Record<StepStatus, string> = {
  pending: "border-default bg-[color:var(--surface)] text-muted-foreground",
  active: "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]",
  complete: "border-default bg-[color:var(--surface)] text-foreground",
  error: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
};

const logLevelClassName: Record<ExecutionLog["level"], string> = {
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
