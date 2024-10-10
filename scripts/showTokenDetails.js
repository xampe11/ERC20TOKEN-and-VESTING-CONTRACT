const { ethers } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function main() {
    const jpfTokenContract = await ethers.getContract("JPFToken")

    const decimals = await jpfTokenContract.decimals()

    console.log("Checking Token TotalSupply...")

    const totalSupply = await jpfTokenContract.totalSupply()

    const formatSupply = totalSupply / BigInt(10) ** decimals

    console.log("Token total Supply: " + formatSupply)
    console.log("-----------------------------------")
    console.log("Checking balance of 0xf39F...b92266")

    const balanceOf = await jpfTokenContract.balanceOf("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

    const formatBalanceOf = balanceOf / BigInt(10) ** decimals

    console.log("Balance of 0xf39F...b92266: " + formatBalanceOf)
    console.log("-----------------------------------")
    /* const transferTest = await jpfTokenContract.transfer(
        "0xc9e4900E340E3B0E8850242B5338cEC0ac1BD174",
        10000
    ) */

    if (network.config.chainId == 31337) {
        // Moralis has a hard time if you move more than 1 at once!
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
