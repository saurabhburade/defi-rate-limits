// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BucketedRateLimiter} from "../contracts/BucketedRateLimiter.sol";
import {TokenBucketRateLimiter} from "../contracts/TokenBucketRateLimiter.sol";
import {TestBase} from "./TestBase.sol";

contract BucketedRateLimiterTest is TestBase {
    uint256 internal constant LIMIT = 1_000_000;
    uint256 internal constant BUCKET_SIZE = 10 minutes;
    uint256 internal constant NUM_BUCKETS = 6;
    uint256 internal constant WINDOW_DURATION = BUCKET_SIZE * NUM_BUCKETS;

    BucketedRateLimiter internal limiter;

    function setUp() public {
        vm.deal(address(this), 1 ether);
        limiter = new BucketedRateLimiter(LIMIT);
    }

    function test_UsesFixedHourlyPolicy() public view {
        assertEq(limiter.bucketSize(), BUCKET_SIZE);
        assertEq(limiter.numBuckets(), NUM_BUCKETS);
        assertEq(limiter.windowDuration(), WINDOW_DURATION);
        assertEq(limiter.limit(), LIMIT);
    }

    function test_RevertsOnZeroLimit() public {
        vm.expectRevert(abi.encodeWithSelector(BucketedRateLimiter.InvalidConfig.selector));
        new BucketedRateLimiter(0);
    }

    function test_TracksUsageAcrossRollingWindow() public {
        _alignToBucketBoundary();

        limiter.borrow(400_000);
        vm.warp(block.timestamp + 5 minutes);
        limiter.borrow(300_000);
        vm.warp(block.timestamp + BUCKET_SIZE);
        limiter.borrow(200_000);

        assertEq(limiter.windowUsage(), 900_000);
        assertEq(limiter.remainingCapacity(), 100_000);

        vm.expectRevert(abi.encodeWithSelector(BucketedRateLimiter.RateLimited.selector, 100_001, 100_000));
        limiter.borrow(100_001);
    }

    function test_RollsCapacityForwardEveryTenMinutes() public {
        uint256[6] memory amounts = [uint256(90_000), 110_000, 130_000, 150_000, 170_000, 190_000];
        _alignToBucketBoundary();

        uint256 expectedUsage;
        for (uint256 i; i < amounts.length; ++i) {
            limiter.borrow(amounts[i]);
            expectedUsage += amounts[i];
            assertEq(limiter.windowUsage(), expectedUsage);
            if (i < amounts.length - 1) vm.warp(block.timestamp + BUCKET_SIZE);
        }

        for (uint256 i; i < amounts.length; ++i) {
            uint256 remainingWindowUsage;
            for (uint256 j = i; j < amounts.length; ++j) {
                remainingWindowUsage += amounts[j];
            }

            assertEq(limiter.windowUsage(), remainingWindowUsage);
            if (i < amounts.length - 1) vm.warp(block.timestamp + BUCKET_SIZE);
        }

        vm.warp(block.timestamp + BUCKET_SIZE);
        assertEq(limiter.windowUsage(), 0);
        assertEq(limiter.remainingCapacity(), LIMIT);
    }

    function test_FillsAllSixBucketsThenFreesCapacityWhenOldestExpires() public {
        uint256[6] memory amounts = [uint256(150_000), 125_000, 200_000, 175_000, 100_000, 250_000];
        _alignToBucketBoundary();

        for (uint256 i; i < amounts.length; ++i) {
            limiter.borrow(amounts[i]);
            if (i < amounts.length - 1) vm.warp(block.timestamp + BUCKET_SIZE);
        }

        assertEq(limiter.windowUsage(), LIMIT);
        vm.expectRevert(abi.encodeWithSelector(BucketedRateLimiter.RateLimited.selector, 1, 0));
        limiter.borrow(1);

        vm.warp(block.timestamp + BUCKET_SIZE);

        (bool allowed, uint256 usedBefore, uint256 remainingAfter) = limiter.previewBorrow(amounts[0]);
        assertEq(allowed, true);
        assertEq(usedBefore, LIMIT - amounts[0]);
        assertEq(remainingAfter, 0);

        limiter.borrow(amounts[0]);
        assertEq(limiter.windowUsage(), LIMIT);
    }

    function test_AllSixTenMinuteBucketsHaveExplicitSuccessAndFailureBoundaries() public {
        uint256 baseAmount = LIMIT / NUM_BUCKETS;
        uint256[6] memory amounts =
            [baseAmount, baseAmount, baseAmount, baseAmount, baseAmount, LIMIT - (baseAmount * (NUM_BUCKETS - 1))];

        _alignToBucketBoundary();

        uint256 runningUsage;
        for (uint256 i; i < NUM_BUCKETS; ++i) {
            limiter.borrow(amounts[i]);
            runningUsage += amounts[i];

            uint256 available = LIMIT - runningUsage;
            assertEq(limiter.windowUsage(), runningUsage);
            assertEq(limiter.remainingCapacity(), available);

            vm.expectRevert(abi.encodeWithSelector(BucketedRateLimiter.RateLimited.selector, available + 1, available));
            limiter.borrow(available + 1);

            if (i < NUM_BUCKETS - 1) vm.warp(block.timestamp + BUCKET_SIZE);
        }

        assertEq(limiter.windowUsage(), LIMIT);
        assertEq(limiter.remainingCapacity(), 0);

        for (uint256 expiredBucket; expiredBucket < NUM_BUCKETS; ++expiredBucket) {
            vm.warp(block.timestamp + BUCKET_SIZE);

            uint256 freedCapacity = amounts[expiredBucket];
            uint256 expectedUsageBeforeBorrow = LIMIT - freedCapacity;

            assertEq(limiter.windowUsage(), expectedUsageBeforeBorrow);
            assertEq(limiter.remainingCapacity(), freedCapacity);

            (bool allowed, uint256 usedBefore, uint256 remainingAfter) = limiter.previewBorrow(freedCapacity);
            assertEq(allowed, true);
            assertEq(usedBefore, expectedUsageBeforeBorrow);
            assertEq(remainingAfter, 0);

            limiter.borrow(freedCapacity);
            assertEq(limiter.windowUsage(), LIMIT);
            assertEq(limiter.remainingCapacity(), 0);

            vm.expectRevert(abi.encodeWithSelector(BucketedRateLimiter.RateLimited.selector, 1, 0));
            limiter.borrow(1);
        }
    }

    function test_ClearsWindowAfterTenIdleHours() public {
        _alignToBucketBoundary();
        limiter.borrow(700_000);
        vm.warp(block.timestamp + 10 hours);

        assertEq(limiter.windowUsage(), 0);
        assertEq(limiter.remainingCapacity(), LIMIT);

        (, uint256[] memory amounts) = limiter.recentBuckets();
        for (uint256 i; i < amounts.length; ++i) {
            assertEq(amounts[i], 0);
        }
    }

    function test_RecentBucketsReturnsOldestToNewestWindowHistory() public {
        uint256[3] memory amounts = [uint256(120_000), 180_000, 240_000];
        _alignToBucketBoundary();

        for (uint256 i; i < amounts.length; ++i) {
            limiter.borrow(amounts[i]);
            if (i < amounts.length - 1) vm.warp(block.timestamp + BUCKET_SIZE);
        }

        (uint256[] memory bucketIndices, uint256[] memory windowAmounts) = limiter.recentBuckets();
        assertEq(bucketIndices.length, NUM_BUCKETS);
        assertEq(windowAmounts.length, NUM_BUCKETS);

        uint256 currentBucket = limiter.currentBucketId();
        uint256 oldestBucket = currentBucket > (NUM_BUCKETS - 1) ? currentBucket - (NUM_BUCKETS - 1) : 0;

        for (uint256 i; i < NUM_BUCKETS; ++i) {
            assertEq(bucketIndices[i], oldestBucket + i);
        }

        assertEq(windowAmounts[1], amounts[0]);
        assertEq(windowAmounts[2], amounts[1]);
        assertEq(windowAmounts[3], amounts[2]);
        assertEq(windowAmounts[0], 0);
        assertEq(windowAmounts[4], 0);
        assertEq(windowAmounts[5], 0);
    }

    function test_IdleTenHoursResetsAllBucketsForFreshHour() public {
        _alignToBucketBoundary();

        for (uint256 i; i < NUM_BUCKETS; ++i) {
            limiter.borrow(100_000);
            if (i < NUM_BUCKETS - 1) vm.warp(block.timestamp + BUCKET_SIZE);
        }

        vm.warp(block.timestamp + 10 hours);

        assertEq(limiter.windowUsage(), 0);
        assertEq(limiter.remainingCapacity(), LIMIT);

        limiter.borrow(LIMIT);
        assertEq(limiter.windowUsage(), LIMIT);
        assertEq(limiter.remainingCapacity(), 0);

        vm.expectRevert(abi.encodeWithSelector(BucketedRateLimiter.RateLimited.selector, 1, 0));
        limiter.borrow(1);
    }

    function test_RejectsZeroBorrowAndEthTransfers() public {
        vm.expectRevert(abi.encodeWithSelector(BucketedRateLimiter.InvalidAmount.selector));
        limiter.borrow(0);

        (bool ok,) = address(limiter).call{value: 1}("");
        assertEq(ok, false);
    }

    function testFuzz_MatchesReferenceModel(uint32[16] memory rawAmounts, uint8[16] memory rawSkips) public {
        uint256[16] memory bucketIds;
        uint256[16] memory borrowedAmounts;
        uint256 historyCount;

        _alignToBucketBoundary();

        for (uint256 i; i < rawAmounts.length; ++i) {
            uint256 skipBuckets = rawSkips[i] % 4;
            if (skipBuckets > 0) vm.warp(block.timestamp + skipBuckets * BUCKET_SIZE);

            uint256 currentBucket = limiter.currentBucketId();
            uint256 expectedUsage = _bucketModelUsage(bucketIds, borrowedAmounts, historyCount, currentBucket);
            assertEq(limiter.windowUsage(), expectedUsage);
            assertEq(limiter.remainingCapacity(), LIMIT - expectedUsage);

            uint256 amount = uint256(rawAmounts[i]) % (LIMIT + 250_000);
            uint256 available = LIMIT - expectedUsage;
            (bool allowed, uint256 usedBefore, uint256 remainingAfter) = limiter.previewBorrow(amount);
            bool shouldAllow = amount > 0 && amount <= available;

            assertEq(allowed, shouldAllow);
            assertEq(usedBefore, expectedUsage);
            assertEq(remainingAfter, shouldAllow ? available - amount : available);

            if (amount == 0) {
                vm.expectRevert(abi.encodeWithSelector(BucketedRateLimiter.InvalidAmount.selector));
                limiter.borrow(0);
            } else if (amount > available) {
                vm.expectRevert(abi.encodeWithSelector(BucketedRateLimiter.RateLimited.selector, amount, available));
                limiter.borrow(amount);
            } else {
                limiter.borrow(amount);
                bucketIds[historyCount] = currentBucket;
                borrowedAmounts[historyCount] = amount;
                historyCount++;
            }
        }
    }

    function _alignToBucketBoundary() internal {
        uint256 remainder = block.timestamp % BUCKET_SIZE;
        if (remainder != 0) {
            vm.warp(block.timestamp + (BUCKET_SIZE - remainder));
        }
    }

    function _bucketModelUsage(
        uint256[16] memory bucketIds,
        uint256[16] memory borrowedAmounts,
        uint256 historyCount,
        uint256 currentBucket
    ) internal pure returns (uint256 total) {
        uint256 oldestBucket = currentBucket >= NUM_BUCKETS - 1 ? currentBucket - (NUM_BUCKETS - 1) : 0;

        for (uint256 i; i < historyCount; ++i) {
            if (bucketIds[i] >= oldestBucket && bucketIds[i] <= currentBucket) {
                total += borrowedAmounts[i];
            }
        }
    }
}

contract TokenBucketRateLimiterTest is TestBase {
    uint256 internal constant MAX_CAPACITY = 1_000_000;
    uint256 internal constant REFILL_RATE = MAX_CAPACITY / 1 hours;

    TokenBucketRateLimiter internal limiter;

    function setUp() public {
        vm.deal(address(this), 1 ether);
        limiter = new TokenBucketRateLimiter(MAX_CAPACITY, REFILL_RATE);
    }

    function test_RevertsOnInvalidConfig() public {
        vm.expectRevert(abi.encodeWithSelector(TokenBucketRateLimiter.InvalidConfig.selector));
        new TokenBucketRateLimiter(0, REFILL_RATE);

        vm.expectRevert(abi.encodeWithSelector(TokenBucketRateLimiter.InvalidConfig.selector));
        new TokenBucketRateLimiter(MAX_CAPACITY, 0);
    }

    function test_RefillsContinuouslyOverTime() public {
        limiter.borrow(900_000);
        assertEq(limiter.availableCapacity(), 100_000);

        (bool allowedBefore, uint256 availableBefore,) = limiter.previewBorrow(200_000);
        assertEq(allowedBefore, false);
        assertEq(availableBefore, 100_000);

        vm.warp(block.timestamp + 20);

        assertEq(limiter.availableCapacity(), 100_000 + (20 * REFILL_RATE));
        (bool allowedAfter,, uint256 remainingAfter) = limiter.previewBorrow(100_000);
        assertEq(allowedAfter, true);
        assertEq(remainingAfter, limiter.availableCapacity() - 100_000);
    }

    function test_RejectsInvalidBorrowsAndLongIdleSaturates() public {
        vm.expectRevert(abi.encodeWithSelector(TokenBucketRateLimiter.InvalidAmount.selector));
        limiter.borrow(0);

        vm.expectRevert(
            abi.encodeWithSelector(TokenBucketRateLimiter.ExceedsBurstCapacity.selector, MAX_CAPACITY + 1, MAX_CAPACITY)
        );
        limiter.borrow(MAX_CAPACITY + 1);

        limiter.borrow(950_000);
        vm.expectRevert(abi.encodeWithSelector(TokenBucketRateLimiter.RateLimited.selector, 300_000, 50_000));
        limiter.borrow(300_000);

        vm.warp(block.timestamp + 10 hours);
        assertEq(limiter.availableCapacity(), MAX_CAPACITY);
        assertEq(limiter.secondsUntilFull(), 0);
    }

    function test_ReportsRoundedWaitTimesAndSurvivesExtremeIdlePeriods() public {
        limiter.borrow(995_000);
        assertEq(limiter.secondsUntilAvailable(0), 0);
        assertEq(limiter.secondsUntilAvailable(MAX_CAPACITY + 1), type(uint256).max);
        assertEq(limiter.secondsUntilAvailable(12_000), 26);
        assertEq(limiter.secondsUntilAvailable(21_000), 58);

        vm.warp(block.timestamp + (10 * 365 days));
        assertEq(limiter.availableCapacity(), MAX_CAPACITY);
        assertEq(limiter.secondsUntilFull(), 0);
    }

    function test_RejectsEthTransfers() public {
        (bool ok,) = address(limiter).call{value: 1}("");
        assertEq(ok, false);
    }

    function testFuzz_MatchesReferenceModel(uint32[20] memory rawAmounts, uint8[20] memory rawSkips) public {
        uint256 modelCapacity = MAX_CAPACITY;
        uint256 modelLastUpdate = block.timestamp;

        for (uint256 i; i < rawAmounts.length; ++i) {
            uint256 skipSeconds = rawSkips[i] % 121;
            if (skipSeconds > 0) vm.warp(block.timestamp + skipSeconds);

            uint256 currentTime = block.timestamp;
            uint256 expectedAvailable = _tokenModelAvailable(modelCapacity, modelLastUpdate, currentTime);
            assertEq(limiter.availableCapacity(), expectedAvailable);

            uint256 amount = uint256(rawAmounts[i]) % (MAX_CAPACITY + 250_000);
            bool shouldAllow = amount > 0 && amount <= expectedAvailable && amount <= MAX_CAPACITY;
            (bool allowed, uint256 availableBefore, uint256 remainingAfter) = limiter.previewBorrow(amount);

            assertEq(allowed, shouldAllow);
            assertEq(availableBefore, expectedAvailable);
            assertEq(remainingAfter, shouldAllow ? expectedAvailable - amount : expectedAvailable);

            if (amount == 0) {
                vm.expectRevert(abi.encodeWithSelector(TokenBucketRateLimiter.InvalidAmount.selector));
                limiter.borrow(0);
            } else if (amount > MAX_CAPACITY) {
                vm.expectRevert(
                    abi.encodeWithSelector(TokenBucketRateLimiter.ExceedsBurstCapacity.selector, amount, MAX_CAPACITY)
                );
                limiter.borrow(amount);
            } else if (amount > expectedAvailable) {
                vm.expectRevert(
                    abi.encodeWithSelector(TokenBucketRateLimiter.RateLimited.selector, amount, expectedAvailable)
                );
                limiter.borrow(amount);
            } else {
                limiter.borrow(amount);
                modelCapacity = expectedAvailable - amount;
                modelLastUpdate = currentTime;
            }
        }
    }

    function _tokenModelAvailable(uint256 modelCapacity, uint256 modelLastUpdate, uint256 currentTime)
        internal
        pure
        returns (uint256)
    {
        if (modelCapacity >= MAX_CAPACITY) return MAX_CAPACITY;

        uint256 elapsed = currentTime - modelLastUpdate;
        uint256 refilled = modelCapacity + elapsed * REFILL_RATE;
        return refilled > MAX_CAPACITY ? MAX_CAPACITY : refilled;
    }
}
