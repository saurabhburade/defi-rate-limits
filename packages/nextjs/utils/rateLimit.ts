import { getBlockExplorerTxUrl } from "~~/config/web3";

export const BORROW_GAS_LIMIT = 150_000n;

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export const formatAmount = (value?: bigint, compact = false) => {
  if (value === undefined) return "--";
  const normalizedValue = value;
  if (!compact) return `${normalizedValue.toLocaleString("en-US")} units`;

  const absolute = normalizedValue < 0n ? -normalizedValue : normalizedValue;
  const sign = normalizedValue < 0n ? "-" : "";
  const thresholds = [
    { divisor: 1_000_000_000_000n, suffix: "T" },
    { divisor: 1_000_000_000n, suffix: "B" },
    { divisor: 1_000_000n, suffix: "M" },
    { divisor: 1_000n, suffix: "K" },
  ] as const;

  for (const threshold of thresholds) {
    if (absolute >= threshold.divisor) {
      const whole = absolute / threshold.divisor;
      const fraction = Number((absolute % threshold.divisor) * 10n) / Number(threshold.divisor);
      return `${sign}${numberFormatter.format(Number(whole) + fraction)}${threshold.suffix} units`;
    }
  }

  return `${normalizedValue.toLocaleString("en-US")} units`;
};

export const formatPercent = (value?: bigint, total?: bigint) => {
  if (value === undefined || total === undefined || total === 0n) return 0;
  return Number((value * 10_000n) / total) / 100;
};

export const formatDuration = (value?: bigint) => {
  if (value === undefined) return "--";
  if (value === 0n) return "Now";
  if (value > 10n ** 12n) return "Not reachable";

  const totalSeconds = Number(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const safeParseAmount = (value: string) => {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return undefined;
  if (!/^\d+$/.test(normalized)) return undefined;

  try {
    const parsed = BigInt(normalized);
    return parsed > 0n ? parsed : undefined;
  } catch {
    return undefined;
  }
};

export const shortAddress = (address?: string) => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "--");

export const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object") {
    const maybeError = error as { shortMessage?: string; message?: string; details?: string };
    const combined =
      `${maybeError.shortMessage || ""} ${maybeError.message || ""} ${maybeError.details || ""}`.toLowerCase();
    if (
      combined.includes("failed to fetch") ||
      combined.includes("networkerror") ||
      combined.includes("network error")
    ) {
      return "RPC transport failed while preparing or sending the transaction. The contract did not execute.";
    }
    return maybeError.shortMessage || maybeError.message || maybeError.details || "Transaction failed.";
  }
  return "Transaction failed.";
};

export const getExplorerTxUrl = (chainId: number, txHash?: `0x${string}`) =>
  txHash ? getBlockExplorerTxUrl(chainId, txHash) : "";
