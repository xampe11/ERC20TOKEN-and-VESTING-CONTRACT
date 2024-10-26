const { ethers } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-network-helpers")

const AMOUNT = 100

const DURATION = 30 * 24 * 60 * 60 // 1 month
let revocable = true

async function main() {
    console.log("Getting contract information...")
    const token = await ethers.getContract("JPFToken")

    const [deployer, player, player2] = await ethers.getSigners()

    console.log("deployer: ", deployer.address)

    const tokenVesting = await ethers.getContract("TokenVesting")

    console.log("Token Contract: ", token.target)
    console.log("Vesting Contract: ", tokenVesting.target)
    console.log("Information gathered successfully.")
    console.log("Creating vesting schedule...")

    const START_TIME = await time.latest()

    console.log(
        "Balance of deployer: ",
        (await token.balanceOf(deployer.address)) / BigInt(10) ** BigInt(await token.decimals())
    )
    console.log("Adding token to supported tokens...")
    await tokenVesting.addSupportedToken(token.target)

    console.log("Approving allowance to contract...")

    await token.approve(tokenVesting.target, 100)

    console.log("Token Allowance: ", await token.allowance(deployer.address, tokenVesting.target))

    console.log("Creating vesting schedule...")

    await tokenVesting.createVestingSchedule(
        deployer.address,
        token.target,
        AMOUNT,
        START_TIME,
        DURATION,
        revocable
    )

    console.log("Vesting schedule created successfully.")
    console.log(
        "Vesting Schedule details: ",
        await tokenVesting.getVestingSchedule(deployer.address, 0)
    )
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
