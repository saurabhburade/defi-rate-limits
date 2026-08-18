// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Token Bucket Rate Limiter
/// @notice Enforces a burst cap with continuous refill over time.
/// @dev `capacity` stores the last sampled available amount, not a synthetic balance.
/// @dev `lastUpdate` is only advanced after a successful borrow so the refill projection stays deterministic.
contract TokenBucketRateLimiter {
    error InvalidConfig();
    error InvalidAmount();
    error EtherNotAccepted();
    error ExceedsBurstCapacity(uint256 requested, uint256 maxCapacity);
    error RateLimited(uint256 requested, uint256 available);

    /// @notice Hard upper bound for a single borrow and the refill ceiling.
    /// @dev Immutable after construction.
    uint256 public immutable maxCapacity;

    /// @notice Amount refilled per second while the bucket is below `maxCapacity`.
    /// @dev Immutable after construction.
    uint256 public immutable refillRate;

    /// @notice Last cached available capacity after the most recent successful borrow.
    /// @dev This value is projected forward by `availableCapacity()` using `block.timestamp`.
    uint256 public capacity;

    /// @notice Timestamp, in seconds since the Unix epoch, when `capacity` was last sampled.
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
    /// @dev Reverts if `amount` exceeds the live projected capacity or the burst ceiling.
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
    /// @dev The returned value saturates at `maxCapacity`.
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

    /// @notice Return the number of whole seconds needed before `amount` becomes available.
    /// @dev Returns `type(uint256).max` for impossible requests above the burst ceiling.
    function secondsUntilAvailable(uint256 amount) external view returns (uint256) {
        uint256 available = availableCapacity();
        if (amount == 0 || amount <= available) return 0;
        if (amount > maxCapacity) return type(uint256).max;

        uint256 deficit = amount - available;
        return (deficit + refillRate - 1) / refillRate;
    }

    /// @notice Return the number of whole seconds until the bucket is refilled to `maxCapacity`.
    function secondsUntilFull() external view returns (uint256) {
        uint256 available = availableCapacity();
        if (available >= maxCapacity) return 0;

        uint256 missing = maxCapacity - available;
        return (missing + refillRate - 1) / refillRate;
    }
}
