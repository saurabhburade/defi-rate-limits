"use client";

import { useEffect, useMemo, useState } from "react";

export const useLiveTokenBucketMetrics = ({
  availableCapacity,
  maxCapacity,
  refillRate,
  secondsUntilFull,
  secondsUntilAvailable,
  animateAvailable = false,
}: {
  availableCapacity?: bigint;
  maxCapacity?: bigint;
  refillRate?: bigint;
  secondsUntilFull?: bigint;
  secondsUntilAvailable?: bigint;
  animateAvailable?: boolean;
}) => {
  const [sampledAtMs, setSampledAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const now = Date.now();
    setNowMs(now);
    setSampledAtMs(now);
  }, [secondsUntilFull?.toString(), secondsUntilAvailable?.toString()]);

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return useMemo(() => {
    if (sampledAtMs === null) {
      return {
        liveAvailableCapacity: availableCapacity,
        liveSecondsUntilFull: secondsUntilFull,
        liveSecondsUntilAvailable: secondsUntilAvailable,
      };
    }

    const elapsedSeconds = BigInt(Math.max(0, Math.floor((nowMs - sampledAtMs) / 1000)));
    const projectedAvailable =
      animateAvailable && availableCapacity !== undefined && refillRate !== undefined
        ? availableCapacity + elapsedSeconds * refillRate
        : availableCapacity;
    const liveAvailableCapacity =
      projectedAvailable !== undefined && maxCapacity !== undefined && projectedAvailable > maxCapacity
        ? maxCapacity
        : projectedAvailable;

    const reduceCountdown = (value?: bigint) => {
      if (value === undefined) return value;
      return value > elapsedSeconds ? value - elapsedSeconds : 0n;
    };

    return {
      liveAvailableCapacity,
      liveSecondsUntilFull: reduceCountdown(secondsUntilFull),
      liveSecondsUntilAvailable: reduceCountdown(secondsUntilAvailable),
    };
  }, [
    animateAvailable,
    availableCapacity,
    maxCapacity,
    nowMs,
    refillRate,
    sampledAtMs,
    secondsUntilAvailable,
    secondsUntilFull,
  ]);
};
