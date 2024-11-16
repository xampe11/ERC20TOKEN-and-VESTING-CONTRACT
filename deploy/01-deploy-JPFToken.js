const { deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { moveBlocks } = require("../utils/move-blocks")
const { getAutomaticTypeDirectiveNames } = require("typescript")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const arguments = []

    const jpfToken = await deploy("JPFToken", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(jpfToken.address, arguments)
    }

    log("---------------------------------")
}

module.exports.tags = ["all"]
