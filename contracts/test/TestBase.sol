// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface Vm {
    function deal(address account, uint256 newBalance) external;
    function expectEmit(bool checkTopic1, bool checkTopic2, bool checkTopic3, bool checkData) external;
    function expectRevert(bytes calldata revertData) external;
    function prank(address sender) external;
    function warp(uint256 newTimestamp) external;
}

abstract contract TestBase {
    error AssertionFailed(string message);

    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function assertEq(uint256 left, uint256 right) internal pure {
        if (left != right) revert AssertionFailed("uint256 mismatch");
    }

    function assertEq(uint256 left, uint256 right, string memory message) internal pure {
        if (left != right) revert AssertionFailed(message);
    }

    function assertEq(bool left, bool right) internal pure {
        if (left != right) revert AssertionFailed("bool mismatch");
    }

    function assertEq(bool left, bool right, string memory message) internal pure {
        if (left != right) revert AssertionFailed(message);
    }

    function assertEq(address left, address right) internal pure {
        if (left != right) revert AssertionFailed("address mismatch");
    }

    function assertEq(address left, address right, string memory message) internal pure {
        if (left != right) revert AssertionFailed(message);
    }

    function assertTrue(bool condition) internal pure {
        if (!condition) revert AssertionFailed("assert true failed");
    }

    function assertTrue(bool condition, string memory message) internal pure {
        if (!condition) revert AssertionFailed(message);
    }
}
