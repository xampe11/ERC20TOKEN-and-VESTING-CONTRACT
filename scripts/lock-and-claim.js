const { ethers } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-network-helpers")

const AMOUNT = ethers.parseEther("100")

let revocable = true
const ONE_DAY = 24 * 60 * 60
const SIX_DAYS = 6 * ONE_DAY
const ONE_MONTH = 30 * ONE_DAY
const RELEASE_PERCENTAGE = 2410 // 24.1% in basis points

const DURATION = ONE_MONTH

async function main() {
    console.log("Getting contract information...")
    const token = await ethers.getContract("JPFToken")

    const [deployer, player, player2] = await ethers.getSigners()

    console.log("deployer: ", deployer.address)

    const tokenVesting = await ethers.getContract("TokenVestingV2")

    console.log("Token Contract: ", token.target)
    console.log("Vesting Contract: ", tokenVesting.target)
    console.log("Information gathered successfully.")

    const START_TIME = await time.latest()

    console.log(
        "Balance of deployer: ",
        (await token.balanceOf(deployer.address)) / BigInt(10) ** BigInt(await token.decimals())
    )

    console.log("Approving allowance to contract...")

    await token.approve(tokenVesting.target, ethers.parseEther("100"))

    console.log(
        "Token Allowance: ",
        (await token.allowance(deployer.address, tokenVesting.target)) /
            BigInt(10) ** BigInt(await token.decimals())
    )

    console.log("Creating vesting schedule...")

    await tokenVesting.createVestingScheduleWithRelease(
        deployer.address,
        token.target,
        AMOUNT,
        START_TIME,
        SIX_DAYS,
        RELEASE_PERCENTAGE,
        revocable
    )

    console.log("Vesting schedule created successfully.")
    console.log(
        "Vesting Schedule details: ",
        await tokenVesting.vestingSchedules(deployer.address, 0)
    )

    console.log("Moving time forward...")

    time.increase(SIX_DAYS * 2)

    console.log("Moved 2 intervals forward.")

    console.log(
        "Balance of deployer: ",
        (await token.balanceOf(deployer.address)) / BigInt(10) ** BigInt(await token.decimals())
    )

    console.log("Claiming tokens...")

    await tokenVesting.claimTokens(0)

    console.log("Tokens claimed.")

    console.log(
        "Balance of deployer: ",
        (await token.balanceOf(deployer.address)) / BigInt(10) ** BigInt(await token.decimals())
    )

    console.log("Checking total remaining locked tokens...")

    const schedule = await tokenVesting.vestingSchedules(deployer.address, 0)

    console.log(
        "Total remaining tokens: ",
        (schedule.totalAmount - schedule.claimedAmount) /
            BigInt(10) ** BigInt(await token.decimals())
    )

    console.log("Moving time forward...")

    time.increase(SIX_DAYS * 2)

    console.log("Moved 2 intervals forward.")
    console.log(
        "Balance of deployer: ",
        (await token.balanceOf(deployer.address)) / BigInt(10) ** BigInt(await token.decimals())
    )

    console.log("Claiming tokens...")

    await tokenVesting.claimTokens(0)

    console.log("Tokens claimed.")

    console.log(
        "Balance of deployer: ",
        (await token.balanceOf(deployer.address)) / BigInt(10) ** BigInt(await token.decimals())
    )

    console.log("Checking total remaining locked tokens...")

    const schedule2 = await tokenVesting.vestingSchedules(deployer.address, 0)

    console.log(
        "Total remaining tokens: ",
        (schedule2.totalAmount - schedule2.claimedAmount) /
            BigInt(10) ** BigInt(await token.decimals())
    )

    console.log("Moving time forward...")

    time.increase(SIX_DAYS)

    console.log("Moved 1 interval forward.")
    console.log(
        "Balance of deployer: ",
        (await token.balanceOf(deployer.address)) / BigInt(10) ** BigInt(await token.decimals())
    )

    console.log("Claiming tokens...")

    await tokenVesting.claimTokens(0)

    console.log("Tokens claimed.")

    console.log(
        "Balance of deployer: ",
        (await token.balanceOf(deployer.address)) / BigInt(10) ** BigInt(await token.decimals())
    )

    console.log("Checking total remaining locked tokens...")

    const schedule3 = await tokenVesting.vestingSchedules(deployer.address, 0)

    console.log(
        "Total remaining tokens: ",
        (schedule3.totalAmount - schedule3.claimedAmount) /
            BigInt(10) ** BigInt(await token.decimals())
    )
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
