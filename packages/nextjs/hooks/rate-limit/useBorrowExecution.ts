"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getConfiguredChain } from "~~/config/web3";
import { useDeployedContract } from "~~/hooks/useDeployedContract";
import { BORROW_GAS_LIMIT, getErrorMessage, getExplorerTxUrl, safeParseAmount } from "~~/utils/rateLimit";
import { getParsedErrorWithKnownAbis } from "~~/utils/web3Errors";

type BorrowableContractName = "BucketedRateLimiter" | "TokenBucketRateLimiter";
type ExecutionPhase = "idle" | "simulating" | "simulated" | "awaiting_wallet" | "confirming" | "confirmed" | "failed";
type StepKey = "input" | "simulate" | "wallet" | "confirm";
type StepStatus = "pending" | "active" | "complete" | "error";

type ExecutionStep = {
  key: StepKey;
  label: string;
  detail: string;
  status: StepStatus;
};

type ExecutionLog = {
  id: number;
  level: "info" | "success" | "error";
  message: string;
};

type SendStatus = {
  phase: ExecutionPhase;
  title: string;
  detail: string;
  txHash?: `0x${string}`;
  explorerUrl?: string;
  errorMessage?: string;
};

const defaultStatus: SendStatus = {
  phase: "idle",
  title: "Ready",
  detail: "Validate the amount, optionally simulate, then send once the wallet prompt appears.",
};

const isUserRejectedError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: number; shortMessage?: string; message?: string };
  const message = `${maybeError.shortMessage || ""} ${maybeError.message || ""}`.toLowerCase();
  return maybeError.code === 4001 || message.includes("user rejected") || message.includes("rejected the request");
};

const statusByPhase = (
  phase: ExecutionPhase,
  errorMessage: string | null,
  txHash: `0x${string}` | null,
  explorerUrl: string,
): SendStatus => {
  switch (phase) {
    case "simulating":
      return {
        phase,
        title: "Running simulation",
        detail: "The app is checking the exact borrow call with the public client before any wallet prompt is shown.",
      };
    case "simulated":
      return {
        phase,
        title: "Simulation passed",
        detail: "The call can proceed. You can send now or change the amount and resimulate.",
      };
    case "awaiting_wallet":
      return {
        phase,
        title: "Waiting for wallet approval",
        detail: "Review the transaction in your wallet. Nothing is broadcast until you approve it.",
      };
    case "confirming":
      return {
        phase,
        title: "Transaction pending",
        detail: "The wallet submitted the transaction. The UI is waiting for the selected network to confirm it.",
        txHash: txHash ?? undefined,
        explorerUrl,
      };
    case "confirmed":
      return {
        phase,
        title: "Transaction confirmed",
        detail: "The borrow completed successfully and the read panels will refresh automatically.",
        txHash: txHash ?? undefined,
        explorerUrl,
      };
    case "failed":
      return {
        phase,
        title: "Execution failed",
        detail: errorMessage || "The transaction flow stopped before confirmation.",
        txHash: txHash ?? undefined,
        explorerUrl,
        errorMessage: errorMessage || undefined,
      };
    default:
      return defaultStatus;
  }
};

export const useBorrowExecution = ({
  contractName,
  amount,
  idleDetail,
}: {
  contractName: BorrowableContractName;
  amount: string;
  idleDetail: string;
}) => {
  const parsedAmount = useMemo(() => safeParseAmount(amount), [amount]);
  const contractAmount = useMemo(() => parsedAmount, [parsedAmount]);
  const amountKey = parsedAmount?.toString() ?? "";
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const targetNetwork = useMemo(() => getConfiguredChain(chain?.id), [chain?.id]);
  const publicClient = usePublicClient({ chainId: targetNetwork.id });
  const { data: deployedContract } = useDeployedContract({ chainId: targetNetwork.id, contractName });
  const clientReady = Boolean(address && walletClient && publicClient && deployedContract);

  const [phase, setPhase] = useState<ExecutionPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<StepKey | null>(null);
  const [lastSimulatedAmountKey, setLastSimulatedAmountKey] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  const parseExecutionError = (error: unknown) => {
    try {
      return getParsedErrorWithKnownAbis(error, targetNetwork.id);
    } catch {
      return getErrorMessage(error);
    }
  };

  const pushLog = (level: ExecutionLog["level"], message: string) => {
    setLogs(current => [...current, { id: Date.now() + current.length, level, message }]);
  };

  useEffect(() => {
    setPhase("idle");
    setErrorMessage(null);
    setFailedStep(null);
    setTxHash(null);
    setLogs([]);
  }, [amountKey, contractName]);

  const validate = () => {
    if (parsedAmount === undefined || contractAmount === undefined) {
      setPhase("failed");
      setFailedStep("input");
      setErrorMessage("Enter a positive whole-number amount.");
      pushLog("error", "Input validation failed: amount must be a positive whole number.");
      return false;
    }

    if (!address) {
      setPhase("failed");
      setFailedStep("wallet");
      setErrorMessage("Connect a wallet before sending the borrow transaction.");
      pushLog("error", "Wallet check failed: no connected account.");
      return false;
    }

    if (!walletClient) {
      setPhase("failed");
      setFailedStep("wallet");
      setErrorMessage("Wallet client is not ready yet.");
      pushLog("error", "Wallet check failed: wallet client is not ready.");
      return false;
    }

    if (!publicClient || !deployedContract) {
      setPhase("failed");
      setFailedStep("simulate");
      setErrorMessage("Contract client is still loading. Try again in a moment.");
      pushLog("error", "Client readiness check failed: contract or public client is still loading.");
      return false;
    }

    pushLog(
      "success",
      `Input validated: display amount ${parsedAmount.toLocaleString("en-US")} -> raw contract amount ${contractAmount.toString()}.`,
    );
    return true;
  };

  const simulate = async () => {
    setLogs([]);
    if (!validate()) return null;

    setPhase("simulating");
    setErrorMessage(null);
    setFailedStep(null);
    pushLog("info", `Starting public-client simulation for ${contractAmount!.toString()} raw units.`);

    try {
      const simulation = await publicClient!.simulateContract({
        address: deployedContract!.address,
        abi: deployedContract!.abi,
        functionName: "borrow",
        args: [contractAmount!],
        account: address!,
        gas: BORROW_GAS_LIMIT,
      });

      if ("value" in simulation.request && simulation.request.value && simulation.request.value > 0n) {
        throw new Error("Borrow request unexpectedly includes ETH value.");
      }

      pushLog("success", "Simulation check passed: borrow call is allowed at the current onchain state.");
      pushLog("success", "ETH value check passed: the request has no ETH attached.");
      setPhase("simulated");
      setLastSimulatedAmountKey(amountKey);
      return simulation;
    } catch (error) {
      console.error(`[${contractName}.simulateContract] failed`, error);
      const parsedError = parseExecutionError(error);
      setPhase("failed");
      setFailedStep("simulate");
      setErrorMessage(parsedError);
      pushLog("error", `Simulation failed: ${parsedError}`);
      return null;
    }
  };

  const send = async () => {
    const simulation = await simulate();
    if (!simulation || !walletClient) return;

    let hash: `0x${string}` | undefined;

    try {
      setPhase("awaiting_wallet");
      pushLog("info", "Simulation passed. Prompting wallet for signature and broadcast.");
      const writeRequest = {
        abi: deployedContract!.abi,
        address: deployedContract!.address,
        args: [contractAmount!] as const,
        account: address!,
        chain: targetNetwork,
        functionName: "borrow" as const,
        gas: simulation.request.gas ?? BORROW_GAS_LIMIT,
      };

      pushLog(
        "info",
        `Prepared wallet contract write with gas ${(simulation.request.gas ?? BORROW_GAS_LIMIT).toString()} and wallet-managed fee estimation.`,
      );

      hash = await walletClient.writeContract(writeRequest);
      setTxHash(hash);
      setPhase("confirming");
      pushLog("success", `Wallet submitted transaction: ${hash}`);
      pushLog("info", "Waiting for onchain confirmation receipt.");

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error("Transaction reverted before confirmation.");
      }

      setPhase("confirmed");
      setLastSimulatedAmountKey(amountKey);
      pushLog("success", "Onchain confirmation received. Borrow transaction settled successfully.");
    } catch (error) {
      if (isUserRejectedError(error)) {
        console.info(`[${contractName}.writeContract] user rejected`, error);
        setPhase("failed");
        setFailedStep("wallet");
        setErrorMessage("Transaction rejected in wallet.");
        pushLog("error", "Wallet rejected the transaction request.");
        return;
      }

      console.error(`[${contractName}.writeContract] failed`, error);
      const parsedError = parseExecutionError(error);
      setPhase("failed");
      setFailedStep(hash ? "confirm" : "wallet");
      setErrorMessage(parsedError);
      pushLog("error", `Execution failed: ${parsedError}`);
    }
  };

  const explorerUrl = getExplorerTxUrl(targetNetwork.id, txHash ?? undefined);
  const status =
    phase === "idle"
      ? { ...defaultStatus, detail: idleDetail }
      : statusByPhase(phase, errorMessage, txHash, explorerUrl);

  const steps: ExecutionStep[] = [
    {
      key: "input",
      label: "Validate input",
      detail:
        contractAmount !== undefined
          ? `Display amount ${parsedAmount?.toLocaleString("en-US")} maps to raw contract amount ${contractAmount.toString()}.`
          : "Require a positive whole-number amount before any chain call.",
      status: failedStep === "input" ? "error" : contractAmount !== undefined ? "complete" : "pending",
    },
    {
      key: "simulate",
      label: "Validate executable onchain",
      detail:
        contractAmount !== undefined
          ? `Run publicClient.simulateContract(borrow(${contractAmount.toString()})) to catch limiter reverts before the wallet prompt.`
          : "Run publicClient.simulateContract to catch limiter reverts before the wallet prompt.",
      status:
        failedStep === "simulate"
          ? "error"
          : phase === "simulating"
            ? "active"
            : phase === "simulated" || phase === "awaiting_wallet" || phase === "confirming" || phase === "confirmed"
              ? "complete"
              : "pending",
    },
    {
      key: "wallet",
      label: "Prompt wallet",
      detail: "Ask the wallet to sign and broadcast the prepared borrow request with zero ETH value.",
      status:
        failedStep === "wallet"
          ? "error"
          : phase === "awaiting_wallet"
            ? "active"
            : phase === "confirming" || phase === "confirmed"
              ? "complete"
              : "pending",
    },
    {
      key: "confirm",
      label: phase === "confirming" ? "Transaction pending" : "Confirm onchain",
      detail: "Wait for the receipt so the UI only reports success after settlement.",
      status:
        failedStep === "confirm"
          ? "error"
          : phase === "confirming"
            ? "active"
            : phase === "confirmed"
              ? "complete"
              : "pending",
    },
  ];

  return {
    parsedAmount,
    contractAmount,
    amountKey,
    simulate,
    send,
    phase,
    steps,
    status,
    logs,
    canSubmit: parsedAmount !== undefined && clientReady && phase !== "awaiting_wallet" && phase !== "confirming",
    hasFreshSimulation: lastSimulatedAmountKey === amountKey && (phase === "simulated" || phase === "confirmed"),
  };
};
