const { ethers, getNamedAccounts } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function main() {
    const { deployer, player, player2 } = await getNamedAccounts()

    const jpfTokenContract = await ethers.getContract("JPFToken")

    const decimals = await jpfTokenContract.decimals()

    console.log("Checking Token TotalSupply...")

    const totalSupply = await jpfTokenContract.totalSupply()

    const formatSupply = totalSupply / BigInt(10) ** decimals

    console.log("Token total Supply: " + formatSupply)
    console.log("-----------------------------------")
    console.log("Checking balance of " + deployer)

    const balanceOf = await jpfTokenContract.balanceOf(deployer)

    console.log("Balance of 0xf39F...b92266: " + balanceOf / BigInt(10) ** decimals)
    console.log("-----------------------------------")

    console.log("Making a transfer test..")
    console.log("Transfering 100JPF from 0xf39F...b92266 to 0xc9e4...1BD174")

    const transferTest = await jpfTokenContract.transfer(
        player,
        BigInt(3000) * BigInt(10) ** decimals
    )

    console.log("Checking updated balances...")

    const newBalance = await jpfTokenContract.balanceOf(deployer)
    const newBalance1 = await jpfTokenContract.balanceOf(player)

    console.log("Updated balance of 0xf39F...b92266 : " + newBalance / BigInt(10) ** decimals)
    console.log("Updated balance of 0xc9e4...1BD174 : " + newBalance1 / BigInt(10) ** decimals)
    console.log("-----------------------------------")

    console.log(`Testing the "approve() and transferFrom() functions..."`)
    console.log(
        "Proceeding to approve the allowance of: " + deployer + " of 1000JPF to spender: " + player2
    )
    await jpfTokenContract.connect(player).approve(deployer, 2000)
    //const approval = await jpfTokenContract.approve(deployer, 2000)
    //const approval2 = await jpfTokenContract.approve(player, 1000)

    await jpfTokenContract.connect(deployer)

    console.log("Approval successful!")
    console.log(`Proceeding to test the "transferFrom()" function...`)

    console.log(
        player2 +
            " will proceed to call the function in order to tranfer 1000JPF from " +
            deployer +
            " to " +
            player
    )

    console.log("Transfer in progress...")

    const allowance = await jpfTokenContract.allowance(deployer, player)

    console.log(allowance)

    try {
        await jpfTokenContract.connect(deployer).transferFrom(player, player2, 1000)
        //const transfer = await jpfTokenContract.transferFrom(deployer, player, 1000)
    } catch (error) {
        console.log("Transfer Unseccessful " + error)
    }

    console.log("Transfer Complete!")
    console.log("Checking new balances...")

    const updatedBalance = await jpfTokenContract.balanceOf(deployer)
    const updatedBalance1 = await jpfTokenContract.balanceOf(player)
    const updatedBalance2 = await jpfTokenContract.balanceOf(player2)

    console.log("Updated balance of " + deployer + " : " + updatedBalance / BigInt(10) ** decimals)
    console.log("Updated balance of " + player + " : " + updatedBalance1 / BigInt(10) ** decimals)
    console.log("Updated balance of " + player2 + " : " + updatedBalance2 / BigInt(10) ** decimals)

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
