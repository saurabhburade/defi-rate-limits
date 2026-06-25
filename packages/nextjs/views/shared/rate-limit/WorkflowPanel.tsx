"use client";

import { secondaryButtonClassName } from "@/components/common/Button";
import { BorrowFlowCard } from "@/views/shared/rate-limit/BorrowFlowCard";

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
