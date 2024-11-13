const { deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const arguments = []

    const tokenVesting = await deploy("TokenVestingV2", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(tokenVesting.address, arguments)
    }

    log("---------------------------------")
}

module.exports.tags = ["all"]
