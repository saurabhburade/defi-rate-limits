// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BucketedRateLimiter} from "../contracts/BucketedRateLimiter.sol";
import {TokenBucketRateLimiter} from "../contracts/TokenBucketRateLimiter.sol";

interface Vm {
    function startBroadcast() external;
    function stopBroadcast() external;
}

contract DeployScript {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 private constant LIMIT = 1_000_000;
    uint256 private constant MAX_CAPACITY = 1_000_000;
    uint256 private constant REFILL_RATE = MAX_CAPACITY / 3600;

    function run() external {
        vm.startBroadcast();

        new BucketedRateLimiter(LIMIT);
        new TokenBucketRateLimiter(MAX_CAPACITY, REFILL_RATE);

        vm.stopBroadcast();
    }
}
