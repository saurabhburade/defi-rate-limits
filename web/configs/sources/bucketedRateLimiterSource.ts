export const bucketedRateLimiterSource = `// SPDX-License-Identifier: MIT
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
