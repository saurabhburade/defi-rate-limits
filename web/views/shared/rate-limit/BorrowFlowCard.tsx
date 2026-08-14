"use client";

import {
  primaryButtonClassName,
  primaryButtonToneClassName,
  secondaryButtonClassName,
} from "@/components/common/Button";
import { inputClassName } from "@/components/common/Input";
import { Spinner } from "@/components/common/Spinner";

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
  sendLabel = "Borrow",
  simulateBusyLabel = "Simulating",
  simulateLabel = "Simulate",
  timeline,
  walletConnected,
  onConnectWallet,
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
  walletConnected?: boolean;
  onConnectWallet?: () => void;
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
      {walletConnected === false ? (
        <button
          className={`${primaryButtonClassName} ${primaryButtonToneClassName} w-full sm:col-span-2`}
          disabled={!onConnectWallet}
          onClick={onConnectWallet}
          type="button"
        >
          Connect wallet
        </button>
      ) : (
        <>
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
        </>
      )}
    </div>

    {preview}
    {timeline}
  </div>
);
