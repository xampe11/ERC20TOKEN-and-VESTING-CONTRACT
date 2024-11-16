const { Block } = require("ethers")
const { ethers } = require("hardhat")

const AMOUNT = ethers.parseEther("1000")

let revocable = true
const HALF_HOUR = 30 * 60
const ONE_HOUR = 60 * 60
const ONE_DAY = 24 * 60 * 60
const SIX_DAYS = 6 * ONE_DAY
const RELEASE_PERCENTAGE = 2500 // 25% in basis points

async function main() {
    console.log("Getting contract information...")
    const token = await ethers.getContract("JPFToken")

    const [deployer, player, player2] = await ethers.getSigners()

    console.log("deployer: ", deployer.address)

    const tokenVesting = await ethers.getContract("TokenVestingV2")

    console.log("Token Contract: ", token.target)
    console.log("Vesting Contract: ", tokenVesting.target)
    console.log("Information gathered successfully.")

    /* const START_TIME = (await ethers.provider.getBlock("latest")).timestamp + HALF_HOUR

    console.log(
        "Balance of deployer: ",
        (await token.balanceOf(deployer.address)) / BigInt(10) ** BigInt(await token.decimals())
    )

    console.log("Approving allowance to contract...")

    await token.approve(tokenVesting.target, AMOUNT)

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
        HALF_HOUR,
        RELEASE_PERCENTAGE,
        revocable
    )

    console.log("Vesting schedule created successfully.") */

    const schedule = await tokenVesting.vestingSchedules(deployer.address, 0)

    console.log("Vesting Schedule details: ", schedule)

    console.log("Checking startTime...")
    console.log("Start Time: ", new Date(Number(schedule.startTime) * 1000).toString())

    const scheduleRelease = await tokenVesting.getReleaseSchedule(deployer.address, 0)

    console.log("Checking nextReleaseTime...")
    console.log(
        "Next Release: ",
        new Date(Number(scheduleRelease.nextReleaseTime) * 1000).toString()
    )
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
