import deployedContracts from "@/configs/contracts/deployments";
import { BaseError as BaseViemError, ContractFunctionRevertedError, keccak256, toHex } from "viem";

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

export const getParsedViemError = (error: unknown): string => {
  const maybeWalk = error && typeof error === "object" && "walk" in error ? error.walk : undefined;
  const parsedError = typeof maybeWalk === "function" ? maybeWalk() : error;

  if (parsedError instanceof BaseViemError) {
    if (parsedError.details) {
      return parsedError.details;
    }

    if (parsedError.shortMessage) {
      if (
        parsedError instanceof ContractFunctionRevertedError &&
        parsedError.data &&
        parsedError.data.errorName !== "Error"
      ) {
        const customErrorArgs = parsedError.data.args?.toString() ?? "";
        return `${parsedError.shortMessage.replace(/reverted\.$/, "reverted with the following reason:")}\n${
          parsedError.data.errorName
        }(${customErrorArgs})`;
      }

      return parsedError.shortMessage;
    }

    return parsedError.message ?? parsedError.name ?? "An unknown error occurred";
  }

  if (parsedError && typeof parsedError === "object" && "message" in parsedError) {
    return String(parsedError.message);
  }

  return "An unknown error occurred";
};

export const getParsedErrorWithKnownAbis = (error: unknown, chainId: number): string => {
  const originalParsedError = getParsedViemError(error);

  if (!/Encoded error signature.*not found on ABI/i.test(originalParsedError)) {
    return originalParsedError;
  }

  const signature = originalParsedError.match(/0x[a-fA-F0-9]{8}/)?.[0] ?? "";
  const chainContracts = deployedContracts[chainId as keyof typeof deployedContracts];

  if (!signature || !chainContracts) {
    return originalParsedError;
  }

  const errorLookup: Record<string, { name: string; contract: string; signature: string }> = {};

  for (const [contractName, contract] of Object.entries(chainContracts)) {
    for (const item of contract.abi) {
      if (item.type !== "error") continue;

      const inputTypes = (item.inputs || []).map((input: { type: string }) => input.type).join(",");
      const errorSignature = `${item.name}(${inputTypes})`;
      const errorSelector = keccak256(toHex(errorSignature)).slice(0, 10);

      errorLookup[errorSelector] = {
        name: item.name,
        contract: contractName,
        signature: errorSignature,
      };
    }
  }

  const errorInfo = errorLookup[signature];
  if (!errorInfo) {
    return `${originalParsedError}\n\nThis error may come from a contract called internally by the target contract.`;
  }

  return `Contract function execution reverted with the following reason:\n${errorInfo.signature} from ${errorInfo.contract} contract`;
};
