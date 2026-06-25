"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nowSeconds } from "@/hooks/useNowSeconds";
import { safeParseAmount } from "@/libs/rate-limit/formatting";
import {
  ExecutionLog,
  ExecutionStep,
  LocalBorrowApplyResult,
  LocalBorrowPreview,
  LocalBorrowTraceLog,
  LocalPhase,
  LocalStatus,
  LocalStepKey,
} from "@/types/rate-limit";

const SIMULATE_DELAY_MS = 650;
const APPLY_DELAY_MS = 1800;

const sleep = (durationMs: number) => new Promise(resolve => window.setTimeout(resolve, durationMs));

const statusByPhase = (phase: LocalPhase, idleDetail: string, errorMessage: string | null): LocalStatus => {
  switch (phase) {
    case "simulating":
      return {
        phase,
        title: "Running local simulation",
        detail: "The page is checking the borrow against the in-memory limiter state.",
      };
    case "simulated":
      return {
        phase,
        title: "Simulation passed",
        detail: "The borrow fits the local limiter state. Apply it to mutate this page state.",
      };
    case "applying":
      return {
        phase,
        title: "Applying local borrow",
        detail: "The page is holding a short pending state before committing the local borrow.",
      };
    case "confirmed":
      return {
        phase,
        title: "Local borrow applied",
        detail: "The in-memory limiter state was updated without a wallet prompt or transaction.",
      };
    case "failed":
      return {
        phase,
        title: "Simulation failed",
        detail: errorMessage || "The local borrow could not be applied.",
        errorMessage: errorMessage || undefined,
      };
    default:
      return {
        phase,
        title: "Ready",
        detail: idleDetail,
      };
  }
};

export const useLocalBorrowExecution = ({
  amount,
  applyBorrow,
  idleDetail,
  previewBorrow,
  resetKey,
}: {
  amount: string;
  applyBorrow: (amount: bigint, currentNowSeconds: number) => LocalBorrowApplyResult;
  idleDetail: string;
  previewBorrow: (amount: bigint, currentNowSeconds: number) => LocalBorrowPreview;
  resetKey: number;
}) => {
  const parsedAmount = useMemo(() => safeParseAmount(amount), [amount]);
  const amountKey = parsedAmount?.toString() ?? "";
  const operationIdRef = useRef(0);

  const [phase, setPhase] = useState<LocalPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<LocalStepKey | null>(null);
  const [lastSimulatedAmountKey, setLastSimulatedAmountKey] = useState("");
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  const busy = phase === "simulating" || phase === "applying";

  const appendLog = useCallback((level: ExecutionLog["level"], message: string) => {
    setLogs(current => [...current, { id: Date.now() + current.length, level, message }]);
  }, []);

  const appendTraceLogs = useCallback(
    (trace: LocalBorrowTraceLog[] | undefined) => {
      trace?.forEach(log => appendLog(log.level, log.message));
    },
    [appendLog],
  );

  const fail = useCallback(
    (step: LocalStepKey, message: string) => {
      setPhase("failed");
      setFailedStep(step);
      setErrorMessage(message);
      appendLog("error", message);
    },
    [appendLog],
  );

  useEffect(() => {
    return () => {
      operationIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    operationIdRef.current += 1;
    setPhase("idle");
    setErrorMessage(null);
    setFailedStep(null);
    setLastSimulatedAmountKey("");
    setLogs([]);
  }, [amountKey, resetKey]);

  const startOperation = () => {
    operationIdRef.current += 1;
    return operationIdRef.current;
  };

  const validateAmount = useCallback(() => {
    if (parsedAmount === undefined) {
      setLogs([]);
      fail("input", "Input validation failed: enter a positive whole-number amount.");
      return undefined;
    }

    return parsedAmount;
  }, [fail, parsedAmount]);

  const simulate = useCallback(async () => {
    const operationId = startOperation();
    const validatedAmount = validateAmount();
    if (validatedAmount === undefined) return null;

    setPhase("simulating");
    setErrorMessage(null);
    setFailedStep(null);
    setLogs([
      {
        id: Date.now(),
        level: "info",
        message: `Checking local preview for ${validatedAmount.toLocaleString("en-US")} units.`,
      },
    ]);

    await sleep(SIMULATE_DELAY_MS);
    if (operationId !== operationIdRef.current) return null;

    const preview = previewBorrow(validatedAmount, nowSeconds());
    appendTraceLogs(preview.trace);
    if (!preview.allowed) {
      fail("simulate", preview.reason || "Local simulation rejected the borrow.");
      return preview;
    }

    setPhase("simulated");
    setLastSimulatedAmountKey(validatedAmount.toString());
    appendLog(
      "success",
      `Simulation passed with ${preview.remainingAfter.toLocaleString("en-US")} units remaining after the borrow.`,
    );
    return preview;
  }, [appendLog, appendTraceLogs, fail, previewBorrow, validateAmount]);

  const apply = useCallback(async () => {
    const operationId = startOperation();
    const validatedAmount = validateAmount();
    if (validatedAmount === undefined) return null;

    setPhase("applying");
    setErrorMessage(null);
    setFailedStep(null);
    setLogs([
      {
        id: Date.now(),
        level: "info",
        message: `Local borrow queued for ${validatedAmount.toLocaleString("en-US")} units.`,
      },
      {
        id: Date.now() + 1,
        level: "info",
        message: "Waiting for the local commit point, then rechecking limiter state before mutation.",
      },
    ]);

    await sleep(APPLY_DELAY_MS);
    if (operationId !== operationIdRef.current) return null;

    const result = applyBorrow(validatedAmount, nowSeconds());
    appendTraceLogs(result.trace);
    if (!result.allowed) {
      fail("apply", result.reason || "Local borrow was rejected at commit time.");
      return result;
    }

    setPhase("confirmed");
    setLastSimulatedAmountKey(validatedAmount.toString());
    appendLog(
      "success",
      `Local borrow applied with ${result.remainingAfter.toLocaleString("en-US")} units remaining after commit.`,
    );
    return result;
  }, [appendLog, appendTraceLogs, applyBorrow, fail, validateAmount]);

  const steps: ExecutionStep[] = [
    {
      key: "input",
      label: "Validate input",
      detail:
        parsedAmount !== undefined
          ? `Display amount ${parsedAmount.toLocaleString("en-US")} maps to local raw units.`
          : "Require a positive whole-number amount before local simulation.",
      status: failedStep === "input" ? "error" : parsedAmount !== undefined ? "complete" : "pending",
    },
    {
      key: "simulate",
      label: "Preview local state",
      detail: "Run the same limiter checks without mutating local state.",
      status:
        failedStep === "simulate"
          ? "error"
          : phase === "simulating"
            ? "active"
            : phase === "simulated" || phase === "applying" || phase === "confirmed"
              ? "complete"
              : "pending",
    },
    {
      key: "apply",
      label: "Apply local borrow",
      detail: "Commit the borrow into this page's in-memory limiter state.",
      status:
        failedStep === "apply"
          ? "error"
          : phase === "applying"
            ? "active"
            : phase === "confirmed"
              ? "complete"
              : "pending",
    },
  ];

  return {
    amountKey,
    apply,
    busy,
    canSubmit: !busy,
    hasFreshSimulation: lastSimulatedAmountKey === amountKey && (phase === "simulated" || phase === "confirmed"),
    logs,
    parsedAmount,
    phase,
    simulate,
    status: statusByPhase(phase, idleDetail, errorMessage),
    steps,
  };
};
