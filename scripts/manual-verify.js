const { ethers, network } = require("hardhat")
const { verify } = require("../utils/verify")
const { developmentChains } = require("../helper-hardhat-config")

async function main() {
    console.log("Getting Token contract information...")
    const jpfToken = await ethers.getContract("JPFToken")

    const arguments = []

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying Token Contract...")
        await verify(jpfToken.target, arguments)
    } else {
        console.log("Not verifying as this is a dev chain.")
    }

    console.log("---------------------------------")

    console.log("Getting TokenVesting contract information...")
    const tokenVesting = await ethers.getContract("TokenVestingV2")

    const arguments2 = []

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying TokenVesting Contract...")
        await verify(tokenVesting.target, arguments2)
    } else {
        console.log("Not verifying as this is a dev chain.")
    }

    console.log("---------------------------------")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
