// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract LegacyTokenVesting is Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct VestingSchedule {
        address token; // Address of the token being vested
        uint256 totalAmount; // Total amount of tokens to be vested
        uint256 startTime; // Start time of the vesting period
        uint256 endTime; // End time of the vesting period
        uint256 claimedAmount; // Amount of tokens already claimed
        bool revocable; // Whether the vesting can be revoked
        bool revoked; // Whether the vesting has been revoked
    }

    // Mapping from beneficiary address to their vesting schedules
    mapping(address => VestingSchedule[]) public vestingSchedules;

    // Mapping to track if a token is supported
    mapping(address => bool) public supportedTokens;

    // Events
    event TokensLocked(
        address indexed beneficiary,
        address indexed token,
        uint256 amount,
        uint256 startTime,
        uint256 endTime
    );
    event TokensClaimed(address indexed beneficiary, address indexed token, uint256 amount);
    event VestingRevoked(address indexed beneficiary, address indexed token, uint256 amount);
    event TokenSupported(address indexed token);
    event TokenUnsupported(address indexed token);

    // Errors
    error InvalidAddress();
    error InvalidAmount();
    error InvalidDuration();
    error TokenNotSupported();
    error NoClaimableTokens();
    error NotRevocable();
    error AlreadyRevoked();
    error InvalidScheduleIndex();
    error TransferFailed();

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Adds support for a token
     * @param _token Address of the token to support
     */
    function addSupportedToken(address _token) external onlyOwner {
        if (_token == address(0)) revert InvalidAddress();
        supportedTokens[_token] = true;
        emit TokenSupported(_token);
    }

    /**
     * @notice Removes support for a token
     * @param _token Address of the token to remove support for
     */
    function removeSupportedToken(address _token) external onlyOwner {
        if (_token == address(0)) revert InvalidAddress();
        supportedTokens[_token] = false;
        emit TokenUnsupported(_token);
    }

    /**
     * @notice Pauses all vesting operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses all vesting operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Creates a new vesting schedule for a beneficiary
     * @param _beneficiary Address of the beneficiary
     * @param _token Address of the token to be vested
     * @param _amount Total amount of tokens to be vested
     * @param _startTime Start time of the vesting period
     * @param _duration Duration of the vesting period in seconds
     * @param _revocable Whether the vesting can be revoked by the owner
     */
    function createVestingSchedule(
        address _beneficiary,
        address _token,
        uint256 _amount,
        uint256 _startTime,
        uint256 _duration,
        bool _revocable
    ) external onlyOwner whenNotPaused nonReentrant {
        if (_beneficiary == address(0)) revert InvalidAddress();
        if (_token == address(0)) revert InvalidAddress();
        if (_amount == 0) revert InvalidAmount();
        if (_duration == 0) revert InvalidDuration();
        if (!supportedTokens[_token]) revert TokenNotSupported();

        IERC20 token = IERC20(_token);
        token.safeTransferFrom(msg.sender, address(this), _amount);

        VestingSchedule memory schedule = VestingSchedule({
            token: _token,
            totalAmount: _amount,
            startTime: _startTime,
            endTime: _startTime + _duration,
            claimedAmount: 0,
            revocable: _revocable,
            revoked: false
        });

        vestingSchedules[_beneficiary].push(schedule);

        emit TokensLocked(_beneficiary, _token, _amount, _startTime, _startTime + _duration);
    }

    /**
     * @notice Calculates the amount of tokens that can be claimed by a beneficiary
     * @param _beneficiary Address of the beneficiary
     * @param _scheduleIndex Index of the vesting schedule
     * @return The amount of tokens that can be claimed
     */
    function calculateClaimableAmount(
        address _beneficiary,
        uint256 _scheduleIndex
    ) public view returns (uint256) {
        if (_scheduleIndex >= vestingSchedules[_beneficiary].length) revert InvalidScheduleIndex();

        VestingSchedule storage schedule = vestingSchedules[_beneficiary][_scheduleIndex];

        if (schedule.revoked || block.timestamp < schedule.startTime) {
            return 0;
        }

        if (block.timestamp >= schedule.endTime) {
            return schedule.totalAmount - schedule.claimedAmount;
        }

        uint256 timeElapsed = block.timestamp - schedule.startTime;
        uint256 vestingDuration = schedule.endTime - schedule.startTime;
        uint256 vestedAmount = (schedule.totalAmount * timeElapsed) / vestingDuration;

        return vestedAmount - schedule.claimedAmount;
    }

    /**
     * @notice Checks the remaining tokens that the user still has within the vesting.
     * @param _scheduleIndex Index of the vesting schedule to check remaining tokens from.
     */
    function checkRemainingTokens(uint256 _scheduleIndex) public view returns (uint256) {
        if (_scheduleIndex >= vestingSchedules[msg.sender].length) revert InvalidScheduleIndex();

        VestingSchedule storage schedule = vestingSchedules[msg.sender][_scheduleIndex];
        uint256 remainingTokens = schedule.totalAmount - schedule.claimedAmount;

        if (remainingTokens == 0) revert NoClaimableTokens();

        return remainingTokens;
    }

    /**
     * @notice Claims vested tokens for a specific schedule
     * @param _scheduleIndex Index of the vesting schedule to claim from
     */
    function claimTokens(uint256 _scheduleIndex) external whenNotPaused nonReentrant {
        if (_scheduleIndex >= vestingSchedules[msg.sender].length) revert InvalidScheduleIndex();

        VestingSchedule storage schedule = vestingSchedules[msg.sender][_scheduleIndex];
        uint256 claimableAmount = calculateClaimableAmount(msg.sender, _scheduleIndex);

        if (claimableAmount == 0) revert NoClaimableTokens();

        schedule.claimedAmount = schedule.claimedAmount + claimableAmount;
        IERC20(schedule.token).safeTransfer(msg.sender, claimableAmount);

        emit TokensClaimed(msg.sender, schedule.token, claimableAmount);
    }

    /**
     * @notice Revokes a vesting schedule
     * @param _beneficiary Address of the beneficiary
     * @param _scheduleIndex Index of the vesting schedule to revoke
     */
    function revokeVesting(
        address _beneficiary,
        uint256 _scheduleIndex
    ) external onlyOwner whenNotPaused nonReentrant {
        if (_scheduleIndex >= vestingSchedules[_beneficiary].length) revert InvalidScheduleIndex();

        VestingSchedule storage schedule = vestingSchedules[_beneficiary][_scheduleIndex];

        if (!schedule.revocable) revert NotRevocable();
        if (schedule.revoked) revert AlreadyRevoked();

        uint256 vestedAmount = calculateClaimableAmount(_beneficiary, _scheduleIndex);
        uint256 remainingAmount = schedule.totalAmount - schedule.claimedAmount - vestedAmount;

        schedule.revoked = true;

        if (remainingAmount > 0) {
            IERC20(schedule.token).safeTransfer(owner(), remainingAmount);
            emit VestingRevoked(_beneficiary, schedule.token, remainingAmount);
        }
    }

    /**
     * @notice Gets the number of vesting schedules for a beneficiary
     * @param _beneficiary Address of the beneficiary
     * @return The number of vesting schedules
     */
    function getVestingScheduleCount(address _beneficiary) external view returns (uint256) {
        return vestingSchedules[_beneficiary].length;
    }

    /**
     * @notice Gets the full vesting schedule details
     * @param _beneficiary Address of the beneficiary
     * @param _scheduleIndex Index of the vesting schedule
     * @return Full vesting schedule struct
     */
    function getVestingSchedule(
        address _beneficiary,
        uint256 _scheduleIndex
    ) external view returns (VestingSchedule memory) {
        if (_scheduleIndex >= vestingSchedules[_beneficiary].length) revert InvalidScheduleIndex();
        return vestingSchedules[_beneficiary][_scheduleIndex];
    }
}
