**Contract Overview**

-   This is a Solidity contract that provides a token vesting mechanism with customizable release schedules.
-   It inherits from the `Ownable2Step`, `ReentrancyGuard`, and `Pausable` contracts from OpenZeppelin.
-   The contract manages vesting schedules for multiple beneficiaries and different tokens.

**Vesting Schedules**

-   Each vesting schedule is defined by a `VestingSchedule` struct, which includes details like the token address, total amount, start/end times, and a customizable release schedule.
-   The release schedule is defined by a `ReleaseSchedule` struct, which specifies the time between releases, the next release time, and the percentage of tokens to be released each time.
-   Vesting schedules can be created, claimed, and (if allowed) revoked by the contract owner.

**Functionality**

-   The `createVestingScheduleWithRelease` function allows the contract owner to create a new vesting schedule with a customizable release schedule.
-   The `claimTokens` function allows beneficiaries to claim the vested and released tokens for a specific schedule.
-   The `calculateClaimableAmount` function can be used to determine the amount of tokens that are currently claimable for a given vesting schedule.
-   The contract can be paused and unpaused by the owner to temporarily suspend vesting operations.

**Key Functions**

`createVestingScheduleWithRelease`:

-   This function allows the contract owner to create a new vesting schedule for a beneficiary.
-   It takes the beneficiary address, token address, total amount to be vested, start time, release interval, release percentage, and a flag to indicate if the vesting is revocable.
-   The function performs various validation checks, transfers the tokens from the owner to the contract, and stores the vesting schedule details.
-   It emits a TokensLocked event upon successful creation of the vesting schedule.

`pause and unpause`:

-   These functions allow the contract owner to pause and unpause all vesting operations, respectively.
-   When paused, no new vesting schedules can be created, and no tokens can be claimed.

`calculateClaimableAmount`:

-   This function calculates the amount of tokens that can be currently claimed by a beneficiary for a specific vesting schedule.
-   It takes the beneficiary address and the index of the vesting schedule.
-   The function checks the current time, the vesting schedule, and the release schedule to determine the claimable amount.

`claimTokens`:

-   This function allows a beneficiary to claim the vested and released tokens for a specific vesting schedule.
-   It takes the index of the vesting schedule to claim from.
-   The function checks the claimable amount and transfers the tokens to the beneficiary.
-   It emits a TokensClaimed event upon successful token transfer.

`getReleaseSchedule`:

-   This function is a getter that returns the release schedule details for a specific vesting schedule.
-   It takes the beneficiary address and the index of the vesting schedule.

**Deployment**

-   To deploy the TokenVestingV2 contract, you'll need:

-   Solidity compiler version 0.8.20 or compatible.
-   The necessary OpenZeppelin dependencies: SafeERC20, Ownable2Step, ReentrancyGuard, and Pausable.
-   The contract owner's Ethereum address to call the constructor.

-   The general deployment process would be:

-   Compile the Solidity contract using a tool like Remix, Truffle, or Hardhat.
-   Deploy the contract to the Ethereum network of your choice, providing the owner's address in the constructor.
-   Verify the contract deployment on the blockchain explorer for the network you used.

-   After deployment, the contract owner can start creating vesting schedules using the createVestingScheduleWithRelease function.

**Events and Errors**

-   The contract emits events for various actions, such as tokens being locked, claimed, or vesting being revoked.
-   It also defines several custom errors to handle invalid inputs and edge cases.
