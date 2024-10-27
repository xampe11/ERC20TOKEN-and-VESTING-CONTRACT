// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract TokenVesting is Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct ReleaseSchedule {
        uint256 releaseInterval; // Time between releases in seconds
        uint256 nextReleaseTime; // Timestamp of the next release
        uint256 releasePercentage; // Percentage of vested tokens to release each interval (in basis points, e.g., 1000 = 10%)
    }

    struct VestingSchedule {
        address token; // Address of the token being vested
        uint256 totalAmount; // Total amount of tokens to be vested
        uint256 startTime; // Start time of the vesting period
        uint256 endTime; // End time of the vesting period
        uint256 claimedAmount; // Amount of tokens already claimed
        bool revocable; // Whether the vesting can be revoked
        bool revoked; // Whether the vesting has been revoked
        ReleaseSchedule releaseSchedule; // Release schedule for the vesting
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
        uint256 endTime,
        uint256 releaseInterval,
        uint256 releasePercentage
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
    error InvalidReleaseInterval();
    error InvalidReleasePercentage();
    error ReleaseNotDue();

    constructor() Ownable(msg.sender) {}

    // Existing functions remain the same...

    /**
     * @notice Creates a new vesting schedule with release schedule for a beneficiary
     * @param _beneficiary Address of the beneficiary
     * @param _token Address of the token to be vested
     * @param _amount Total amount of tokens to be vested
     * @param _startTime Start time of the vesting period
     * @param _duration Duration of the vesting period in seconds
     * @param _releaseInterval Time between releases in seconds
     * @param _releasePercentage Percentage of vested tokens to release each interval (in basis points)
     * @param _revocable Whether the vesting can be revoked by the owner
     */
    function createVestingScheduleWithRelease(
        address _beneficiary,
        address _token,
        uint256 _amount,
        uint256 _startTime,
        uint256 _duration,
        uint256 _releaseInterval,
        uint256 _releasePercentage,
        bool _revocable
    ) external onlyOwner whenNotPaused nonReentrant {
        if (_beneficiary == address(0)) revert InvalidAddress();
        if (_token == address(0)) revert InvalidAddress();
        if (_amount == 0) revert InvalidAmount();
        if (_duration == 0) revert InvalidDuration();
        if (!supportedTokens[_token]) revert TokenNotSupported();
        if (_releaseInterval == 0) revert InvalidReleaseInterval();
        if (_releasePercentage == 0 || _releasePercentage > 10000)
            revert InvalidReleasePercentage();

        IERC20 token = IERC20(_token);
        token.safeTransferFrom(msg.sender, address(this), _amount);

        ReleaseSchedule memory releaseSchedule = ReleaseSchedule({
            releaseInterval: _releaseInterval,
            nextReleaseTime: _startTime + _releaseInterval,
            releasePercentage: _releasePercentage
        });

        VestingSchedule memory schedule = VestingSchedule({
            token: _token,
            totalAmount: _amount,
            startTime: _startTime,
            endTime: _startTime + _duration,
            claimedAmount: 0,
            revocable: _revocable,
            revoked: false,
            releaseSchedule: releaseSchedule
        });

        vestingSchedules[_beneficiary].push(schedule);

        emit TokensLocked(
            _beneficiary,
            _token,
            _amount,
            _startTime,
            _startTime + _duration,
            _releaseInterval,
            _releasePercentage
        );
    }

    /**
     * @notice Calculates the amount of tokens that can be claimed based on the release schedule
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

        // Calculate vested amount based on time
        uint256 vestedAmount;
        if (block.timestamp >= schedule.endTime) {
            vestedAmount = schedule.totalAmount;
        } else {
            uint256 timeElapsed = block.timestamp - schedule.startTime;
            uint256 vestingDuration = schedule.endTime - schedule.startTime;
            vestedAmount = (schedule.totalAmount * timeElapsed) / vestingDuration;
        }

        // Calculate releasable amount based on release schedule
        uint256 releasableAmount = vestedAmount - schedule.claimedAmount;
        if (block.timestamp < schedule.releaseSchedule.nextReleaseTime) {
            return 0;
        }

        // Calculate number of release periods passed
        uint256 periodsPassed = (block.timestamp - schedule.releaseSchedule.nextReleaseTime) /
            schedule.releaseSchedule.releaseInterval +
            1;
        uint256 maxReleasablePercentage = periodsPassed *
            schedule.releaseSchedule.releasePercentage;
        if (maxReleasablePercentage > 10000) {
            maxReleasablePercentage = 10000;
        }

        uint256 maxReleasableAmount = (vestedAmount * maxReleasablePercentage) / 10000;
        return maxReleasableAmount > releasableAmount ? releasableAmount : maxReleasableAmount;
    }

    /**
     * @notice Claims vested and released tokens for a specific schedule
     * @param _scheduleIndex Index of the vesting schedule to claim from
     */
    function claimTokens(uint256 _scheduleIndex) external whenNotPaused nonReentrant {
        if (_scheduleIndex >= vestingSchedules[msg.sender].length) revert InvalidScheduleIndex();

        VestingSchedule storage schedule = vestingSchedules[msg.sender][_scheduleIndex];
        uint256 claimableAmount = calculateClaimableAmount(msg.sender, _scheduleIndex);

        if (claimableAmount == 0) revert NoClaimableTokens();

        schedule.claimedAmount += claimableAmount;

        // Update next release time
        while (
            schedule.releaseSchedule.nextReleaseTime <= block.timestamp &&
            schedule.releaseSchedule.nextReleaseTime < schedule.endTime
        ) {
            schedule.releaseSchedule.nextReleaseTime += schedule.releaseSchedule.releaseInterval;
        }

        IERC20(schedule.token).safeTransfer(msg.sender, claimableAmount);

        emit TokensClaimed(msg.sender, schedule.token, claimableAmount);
    }

    // Add getter for release schedule details
    function getReleaseSchedule(
        address _beneficiary,
        uint256 _scheduleIndex
    ) external view returns (ReleaseSchedule memory) {
        if (_scheduleIndex >= vestingSchedules[_beneficiary].length) revert InvalidScheduleIndex();
        return vestingSchedules[_beneficiary][_scheduleIndex].releaseSchedule;
    }
}
