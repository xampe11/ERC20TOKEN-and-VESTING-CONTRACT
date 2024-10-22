const { deployments, getNamedAccounts, network, ethers } = require("hardhat")
const { expect } = require("chai")

describe("ERC20", function () {
    let jpfTokenContract
    let jpfToken
    let dep
    let acc
    let acc2

    beforeEach(async () => {
        console.log("Initializing beforeEach")
        jpfTokenContract = await ethers.getContractFactory("JPFToken")
        console.log("Created contract...")
        const accounts = await ethers.getSigners()
        dep = accounts[0]
        acc = accounts[1]
        acc2 = accounts[2]
        console.log("Created accounts...")
        // Deploy a new token contract for each test
        jpfToken = await jpfTokenContract.deploy()
        // Wait for the transaction to be mined
        await jpfToken.waitForDeployment()

        console.log("Contract Deployed and accounts assigned")
    })

    describe("transferFrom", function () {
        it("Should transfer tokens between accounts when approved", async function () {
            // Transfer 100 tokens from deployer to acc
            await jpfToken.transfer(acc.address, 100)

            // Approve acc2 to spend 50 tokens on behalf of acc
            await jpfToken.connect(acc).approve(acc2.address, 50)

            // Check if approval was successful
            expect(await jpfToken.allowance(acc.address, acc2.address)).to.equal(50)

            // acc2 transfers 50 tokens from acc to themselves
            await jpfToken.connect(acc2).transferFrom(acc.address, acc2.address, 50)

            // Check balances
            expect(await jpfToken.balanceOf(acc.address)).to.equal(50)
            expect(await jpfToken.balanceOf(acc2.address)).to.equal(50)
        })

        it("Should fail if the sender doesn't have enough tokens", async function () {
            try {
                // Log initial balances
                console.log(
                    "Initial balance of acc:",
                    (await jpfToken.balanceOf(acc.address)).toString()
                )
                console.log(
                    "Initial balance of acc2:",
                    (await jpfToken.balanceOf(acc2.address)).toString()
                )

                // Approve acc2 to spend 100 tokens on behalf of acc
                await jpfToken.connect(acc).approve(acc2.address, 100n)
                console.log("Approval successful")

                // Log allowance
                console.log(
                    "Allowance of acc2:",
                    (await jpfToken.allowance(acc.address, acc2.address)).toString()
                )

                // Try to transfer 100 tokens from acc to acc2 (should fail as acc has 0 tokens)

                await expect(
                    jpfToken.connect(acc2).transferFrom(acc.address, acc2.address, 100n)
                ).to.be.revertedWithCustomError(jpfToken, `ERC20InsufficientBalance`)

                console.log("Test completed successfully")
            } catch (error) {
                console.error("Error in test:", error)
                throw error
            }
        })

        it("Should fail if the spender doesn't have enough allowance", async function () {
            // Transfer 100 tokens from deployer to acc
            await jpfToken.transfer(acc.address, 100)

            // Approve acc2 to spend 50 tokens on behalf of acc
            await jpfToken.connect(acc).approve(acc2.address, 50)

            // Try to transfer 100 tokens from acc to acc2 (should fail due to insufficient allowance)
            await expect(
                jpfToken.connect(acc2).transferFrom(acc.address, acc2.address, 100)
            ).to.be.revertedWithCustomError(jpfToken, `ERC20InsufficientAllowance`)
        })
    })
})
