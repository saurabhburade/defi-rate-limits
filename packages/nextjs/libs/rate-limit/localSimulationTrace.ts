export const MAX_UINT256 = (1n << 256n) - 1n;

export const ceilDiv = (value: bigint, divisor: bigint) => (value + divisor - 1n) / divisor;

export const formatUnits = (value: bigint) => `${value.toLocaleString("en-US")} units`;

export const formatSeconds = (seconds: bigint) => `${seconds.toLocaleString("en-US")}s`;

export const formatBucketDuration = (seconds: bigint) => {
  if (seconds >= 3600n && seconds % 3600n === 0n) return `${(seconds / 3600n).toString()}h`;
  if (seconds >= 60n && seconds % 60n === 0n) return `${(seconds / 60n).toString()}m`;
  return `${seconds.toString()}s`;
};
