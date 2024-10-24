// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title SecureLock
 * @notice A time-locked wallet with enhanced security features and gas optimizations
 * @dev Implements reentrancy protection, pausable functionality, and gas-efficient patterns
 */
contract SecureLock is ReentrancyGuard, Pausable, Ownable2Step {
    // Pack related variables together to optimize storage slots
    struct LockSettings {
        uint40 unlockTime; // Timestamps don't need full uint256
        bool emergencyEnabled; // Pack with unlockTime in same slot
    }

    LockSettings private settings;

    // Constants don't use storage
    uint40 private constant MINIMUM_DELAY = 1 days;
    uint40 private constant MAXIMUM_DELAY = 365 days;

    // Events indexed for efficient filtering
    event UnlockTimeUpdated(uint40 indexed newUnlockTime);
    event Withdrawal(uint256 indexed amount, uint40 indexed when);
    event EmergencyWithdrawal(uint256 indexed amount, uint40 when, string reason);

    // Custom errors for cheaper reverts
    error InvalidUnlockTime(uint40 providedTime, uint40 currentTime);
    error WithdrawalTooEarly(uint40 unlockTime, uint40 currentTime);
    error WithdrawalFailed();
    error InvalidDelay();
    error EmergencyDisabled();

    /**
     * @param _unlockTime The timestamp after which funds can be withdrawn
     */
    constructor(uint40 _unlockTime) payable Ownable(msg.sender) {
        uint40 currentTime = uint40(block.timestamp);
        if (_unlockTime <= currentTime) {
            revert InvalidUnlockTime(_unlockTime, currentTime);
        }

        unchecked {
            // Safe because we checked _unlockTime > currentTime above
            uint40 delay = _unlockTime - currentTime;
            if (delay < MINIMUM_DELAY || delay > MAXIMUM_DELAY) {
                revert InvalidDelay();
            }
        }

        settings.unlockTime = _unlockTime;
        settings.emergencyEnabled = true;
    }

    /**
     * @notice Withdraws the full contract balance
     * @dev Gas optimized with unchecked math where safe
     */
    function withdraw() external nonReentrant whenNotPaused onlyOwner {
        uint40 currentTime = uint40(block.timestamp);
        if (currentTime < settings.unlockTime) {
            revert WithdrawalTooEarly(settings.unlockTime, currentTime);
        }

        uint256 amount = address(this).balance;

        // Checks-Effects before external call
        emit Withdrawal(amount, currentTime);

        // Low-level call is more gas efficient than transfer()
        assembly {
            // Gas optimized ETH transfer
            let success := call(gas(), caller(), amount, 0, 0, 0, 0)
            if iszero(success) {
                // Revert with custom error signature
                mstore(0x00, 0x0906e3d3) // WithdrawalFailed signature
                revert(0x00, 0x04)
            }
        }
    }

    /**
     * @notice Emergency withdrawal with optimized gas usage
     * @param reason The reason for emergency withdrawal
     */
    function emergencyWithdraw(string calldata reason) external nonReentrant onlyOwner {
        if (!settings.emergencyEnabled) {
            revert EmergencyDisabled();
        }

        if (bytes(reason).length == 0) {
            revert("Reason required");
        }

        uint256 amount = address(this).balance;

        // Checks-Effects before external call
        emit EmergencyWithdrawal(amount, uint40(block.timestamp), reason);

        assembly {
            let success := call(gas(), caller(), amount, 0, 0, 0, 0)
            if iszero(success) {
                mstore(0x00, 0x0906e3d3) // WithdrawalFailed signature
                revert(0x00, 0x04)
            }
        }
    }

    /**
     * @notice Updates the unlock time with gas optimizations
     * @param newUnlockTime New timestamp for unlock
     */
    function updateUnlockTime(uint40 newUnlockTime) external onlyOwner {
        uint40 currentUnlockTime = settings.unlockTime;
        if (newUnlockTime <= currentUnlockTime) {
            revert InvalidUnlockTime(newUnlockTime, currentUnlockTime);
        }

        unchecked {
            // Safe because we checked newUnlockTime > currentUnlockTime above
            uint40 delay = newUnlockTime - uint40(block.timestamp);
            if (delay > MAXIMUM_DELAY) {
                revert InvalidDelay();
            }
        }

        settings.unlockTime = newUnlockTime;
        emit UnlockTimeUpdated(newUnlockTime);
    }

    /**
     * @notice Toggle emergency withdrawal capability
     */
    function toggleEmergencyWithdraw() external onlyOwner {
        settings.emergencyEnabled = !settings.emergencyEnabled;
    }

    /**
     * @notice Get current unlock time
     * @return Current unlock timestamp
     */
    function getUnlockTime() external view returns (uint40) {
        return settings.unlockTime;
    }

    /**
     * @notice Check if emergency withdrawal is enabled
     * @return Emergency withdrawal status
     */
    function isEmergencyEnabled() external view returns (bool) {
        return settings.emergencyEnabled;
    }

    /**
     * @dev Optimized pause function
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Optimized unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Prevent accidental transfers
     */
    receive() external payable {
        revert("Use constructor");
    }

    /**
     * @dev Prevent undefined function calls
     */
    fallback() external {
        revert("Invalid function");
    }
}
