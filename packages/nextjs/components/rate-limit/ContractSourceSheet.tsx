"use client";

import { useEffect, useId, useState } from "react";
import { CodeIcon, XIcon } from "lucide-react";
import { ghostButtonClassName, secondaryButtonClassName } from "~~/components/rate-limit/ui";

const bucketedRateLimiterSource = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Bucketed Rate Limiter
/// @notice Enforces a borrow cap across a rolling one-hour window using six 10-minute buckets.
/// @dev Storage stays bounded because only six rotating slots are materialized onchain.
/// @dev Each stored bucket tracks an absolute bucket id, not a slot index, so expired history can be ignored safely.
contract BucketedRateLimiter {
    error InvalidConfig();
    error InvalidAmount();
    error EtherNotAccepted();
    error RateLimited(uint256 requested, uint256 available);

    struct Bucket {
        /// @notice Absolute bucket id derived from \`block.timestamp / bucketSize\`.
        uint256 index;
        /// @notice Amount borrowed in the bucket identified by \`index\`.
        uint256 amount;
    }

    /// @notice Duration of one rotating bucket.
    uint256 public constant bucketSize = 10 minutes;
    /// @notice Number of buckets retained in the rolling window.
    uint256 public constant numBuckets = 6;

    /// @notice Total amount that may be borrowed across the rolling window.
    uint256 public immutable limit;

    mapping(uint256 slot => Bucket bucket) private buckets;

    /// @notice Emitted after a successful borrow and the resulting rolling-window usage snapshot.
    event BorrowExecuted(
        address indexed account, uint256 amount, uint256 indexed bucketIndex, uint256 windowUsageAfter
    );

    /// @param _limit Maximum amount borrowable across the rolling one-hour window.
    constructor(uint256 _limit) {
        if (_limit == 0) revert InvalidConfig();
        limit = _limit;
    }

    receive() external payable {
        revert EtherNotAccepted();
    }

    fallback() external payable {
        revert EtherNotAccepted();
    }

    /// @notice Consume capacity from the current 10-minute bucket.
    /// @dev Reverts if the requested amount would exceed the remaining rolling-window capacity.
    function borrow(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();

        uint256 currentIndex = currentBucketId();
        uint256 used = _windowUsage(currentIndex);
        uint256 available = limit - used;
        if (amount > available) revert RateLimited(amount, available);

        uint256 slot = currentIndex % numBuckets;
        Bucket storage bucket = buckets[slot];
        if (bucket.index != currentIndex) {
            bucket.index = currentIndex;
            bucket.amount = 0;
        }

        bucket.amount += amount;

        emit BorrowExecuted(msg.sender, amount, currentIndex, used + amount);
    }

    /// @notice Return the absolute bucket id derived from \`block.timestamp\`.
    function currentBucketId() public view returns (uint256) {
        return block.timestamp / bucketSize;
    }

    /// @notice Return the total rolling-window length covered by the retained buckets.
    function windowDuration() external pure returns (uint256) {
        return bucketSize * numBuckets;
    }

    /// @notice Return the total amount borrowed in the live rolling window.
    function windowUsage() public view returns (uint256) {
        return _windowUsage(currentBucketId());
    }

    /// @notice Return the remaining amount borrowable before the rolling-window limit is reached.
    function remainingCapacity() public view returns (uint256) {
        return limit - windowUsage();
    }

    /// @notice Simulate a borrow without mutating bucket state.
    /// @return allowed True when the borrow would fit inside the live rolling window.
    /// @return usedBefore Total amount already consumed in the live window.
    /// @return remainingAfter Remaining window capacity that would be left after the borrow.
    function previewBorrow(uint256 amount)
        external
        view
        returns (bool allowed, uint256 usedBefore, uint256 remainingAfter)
    {
        usedBefore = windowUsage();
        uint256 available = limit - usedBefore;

        if (amount == 0 || amount > available) {
            return (false, usedBefore, available);
        }

        return (true, usedBefore, available - amount);
    }

    /// @notice Return the retained bucket ids and their amounts from oldest to newest.
    function recentBuckets() external view returns (uint256[] memory bucketIndices, uint256[] memory amounts) {
        uint256 currentIndex = currentBucketId();
        uint256 oldestIndex = _oldestActiveBucket(currentIndex);

        bucketIndices = new uint256[](numBuckets);
        amounts = new uint256[](numBuckets);

        for (uint256 i; i < numBuckets; ++i) {
            uint256 bucketIndex = oldestIndex + i;
            bucketIndices[i] = bucketIndex;
            amounts[i] = _bucketAmountAt(bucketIndex);
        }
    }

    /// @dev Sum only the active bucket ids for the live rolling window.
    function _windowUsage(uint256 currentIndex) internal view returns (uint256 used) {
        uint256 oldestIndex = _oldestActiveBucket(currentIndex);

        for (uint256 bucketIndex = oldestIndex; bucketIndex <= currentIndex; ++bucketIndex) {
            used += _bucketAmountAt(bucketIndex);
        }
    }

    /// @dev Return the oldest bucket id still inside the rolling window.
    function _oldestActiveBucket(uint256 currentIndex) internal pure returns (uint256) {
        uint256 activeWindow = numBuckets - 1;
        return currentIndex > activeWindow ? currentIndex - activeWindow : 0;
    }

    /// @dev Return the amount stored for \`bucketIndex\`, or zero if the slot has been rotated out.
    function _bucketAmountAt(uint256 bucketIndex) internal view returns (uint256) {
        Bucket storage bucket = buckets[bucketIndex % numBuckets];
        return bucket.index == bucketIndex ? bucket.amount : 0;
    }
}
`;

const tokenBucketRateLimiterSource = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Token Bucket Rate Limiter
/// @notice Enforces a burst cap with continuous refill over time.
/// @dev \`capacity\` stores the last sampled available amount, not a synthetic balance.
/// @dev \`lastUpdate\` is only advanced after a successful borrow so the refill projection stays deterministic.
contract TokenBucketRateLimiter {
    error InvalidConfig();
    error InvalidAmount();
    error EtherNotAccepted();
    error ExceedsBurstCapacity(uint256 requested, uint256 maxCapacity);
    error RateLimited(uint256 requested, uint256 available);

    /// @notice Hard upper bound for a single borrow and the refill ceiling.
    /// @dev Immutable after construction.
    uint256 public immutable maxCapacity;

    /// @notice Amount refilled per second while the bucket is below \`maxCapacity\`.
    /// @dev Immutable after construction.
    uint256 public immutable refillRate;

    /// @notice Last cached available capacity after the most recent successful borrow.
    /// @dev This value is projected forward by \`availableCapacity()\` using \`block.timestamp\`.
    uint256 public capacity;

    /// @notice Timestamp, in seconds since the Unix epoch, when \`capacity\` was last sampled.
    /// @dev This is intentionally stored as the onchain timestamp, not a block number.
    uint256 public lastUpdate;

    /// @notice Emitted after a successful borrow and the post-borrow capacity snapshot.
    event BorrowExecuted(address indexed account, uint256 amount, uint256 capacityAfter);

    /// @param _maxCapacity Maximum burst size and refill ceiling.
    /// @param _refillRate Number of units restored per second while below the ceiling.
    constructor(uint256 _maxCapacity, uint256 _refillRate) {
        if (_maxCapacity == 0 || _refillRate == 0) revert InvalidConfig();

        maxCapacity = _maxCapacity;
        refillRate = _refillRate;
        capacity = _maxCapacity;
        lastUpdate = block.timestamp;
    }

    receive() external payable {
        revert EtherNotAccepted();
    }

    fallback() external payable {
        revert EtherNotAccepted();
    }

    /// @notice Consume capacity if enough has refilled since the last borrow.
    /// @dev Reverts if \`amount\` exceeds the live projected capacity or the burst ceiling.
    function borrow(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        if (amount > maxCapacity) revert ExceedsBurstCapacity(amount, maxCapacity);

        uint256 available = availableCapacity();
        if (amount > available) revert RateLimited(amount, available);

        capacity = available - amount;
        lastUpdate = block.timestamp;

        emit BorrowExecuted(msg.sender, amount, capacity);
    }

    /// @notice Return the live available capacity after accounting for elapsed time.
    /// @dev The returned value saturates at \`maxCapacity\`.
    function availableCapacity() public view returns (uint256) {
        if (capacity >= maxCapacity) return maxCapacity;

        uint256 elapsed = block.timestamp - lastUpdate;
        if (elapsed == 0) return capacity;

        uint256 missing = maxCapacity - capacity;
        uint256 secondsToFull = (missing + refillRate - 1) / refillRate;
        if (elapsed >= secondsToFull) return maxCapacity;

        return capacity + elapsed * refillRate;
    }

    /// @notice Simulate a borrow without mutating state.
    /// @return allowed True when the borrow would succeed at the current timestamp.
    /// @return availableBefore Live available capacity before the simulated borrow.
    /// @return remainingAfter Available capacity that would remain if the borrow succeeded.
    function previewBorrow(uint256 amount)
        external
        view
        returns (bool allowed, uint256 availableBefore, uint256 remainingAfter)
    {
        availableBefore = availableCapacity();

        if (amount == 0 || amount > availableBefore || amount > maxCapacity) {
            return (false, availableBefore, availableBefore);
        }

        return (true, availableBefore, availableBefore - amount);
    }

    /// @notice Return the number of whole seconds needed before \`amount\` becomes available.
    /// @dev Returns \`type(uint256).max\` for impossible requests above the burst ceiling.
    function secondsUntilAvailable(uint256 amount) external view returns (uint256) {
        uint256 available = availableCapacity();
        if (amount == 0 || amount <= available) return 0;
        if (amount > maxCapacity) return type(uint256).max;

        uint256 deficit = amount - available;
        return (deficit + refillRate - 1) / refillRate;
    }

    /// @notice Return the number of whole seconds until the bucket is refilled to \`maxCapacity\`.
    function secondsUntilFull() external view returns (uint256) {
        uint256 available = availableCapacity();
        if (available >= maxCapacity) return 0;

        uint256 missing = maxCapacity - available;
        return (missing + refillRate - 1) / refillRate;
    }
}
`;

const ContractSourceButton = ({ fileName, source }: { fileName: string; source: string }) => {
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!mounted) return;

    const frame = requestAnimationFrame(() => setSheetOpen(true));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSheetOpen(false);
      }
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted]);

  return (
    <>
      <button
        aria-expanded={sheetOpen}
        aria-haspopup="dialog"
        aria-label={`View ${fileName}`}
        className={secondaryButtonClassName}
        onClick={() => setMounted(true)}
        style={{
          color: "color-mix(in oklch, var(--muted-foreground) 50%, transparent)",
          height: 28,
          padding: 0,
          width: 28,
        }}
        title={`View ${fileName}`}
        type="button"
      >
        <CodeIcon aria-hidden="true" size={14} />
      </button>

      {mounted ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close source viewer"
            className="absolute inset-0 cursor-default"
            onClick={() => setSheetOpen(false)}
            style={{
              backgroundColor: "rgb(0 0 0 / 0.35)",
              opacity: sheetOpen ? 1 : 0,
              transition: "opacity 240ms ease-out",
            }}
            type="button"
          />
          <aside
            aria-labelledby={titleId}
            aria-modal="true"
            className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-default bg-background shadow-2xl sm:w-[min(44rem,calc(100vw-2rem))]"
            onTransitionEnd={event => {
              if (event.target === event.currentTarget && !sheetOpen) {
                setMounted(false);
              }
            }}
            role="dialog"
            style={{
              transform: sheetOpen ? "translateX(0)" : "translateX(100%)",
              transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
              willChange: "transform",
              width: "min(44rem, 100vw)",
            }}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-default px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Solidity source</p>
                <h2 className="mt-1 truncate text-lg font-semibold text-foreground" id={titleId}>
                  {fileName}
                </h2>
              </div>
              <button
                aria-label="Close source viewer"
                className={ghostButtonClassName}
                onClick={() => setSheetOpen(false)}
                style={{ height: 32, padding: 0, width: 32 }}
                title="Close"
                type="button"
              >
                <XIcon aria-hidden="true" size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-[color:var(--surface)] p-4">
              <pre className="min-w-max text-xs leading-5 text-foreground">
                <code>{source}</code>
              </pre>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
};

export const BucketedRateLimiterSourceButton = () => (
  <ContractSourceButton fileName="BucketedRateLimiter.sol" source={bucketedRateLimiterSource} />
);

export const TokenBucketRateLimiterSourceButton = () => (
  <ContractSourceButton fileName="TokenBucketRateLimiter.sol" source={tokenBucketRateLimiterSource} />
);
