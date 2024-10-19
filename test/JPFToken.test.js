const { deployments, getNamedAccounts, network, ethers } = require("hardhat")

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
        accounts = await ethers.getSigners()
        dep = accounts[0]
        acc = accounts[1]
        acc2 = accounts[2]
        console.log("Created accounts...")
        // Deploy a new token contract for each test
        jpfToken = await jpfTokenContract.deploy()

        console.log("Deploying contract...")
        console.log(jpfToken)

        console.log("Contract Deployed and accounts assigned")

        /* const accounts = await getNamedAccounts()
        dep = accounts[0]
        acc = accounts[1]
        acc2 = accounts[2]
        // Contract deployment and getting test addresses
        const jpfTokenContract = await ethers.utils.getContract("JPFToken")
        jpfToken = jpfTokenContract.connect(dep) */
    })

    describe("transferFrom", function () {
        it("Should transfer tokens between accounts when approved", async function () {
            // Transfer 100 tokens from deployer to player
            await jpfToken.transfer(acc, 100)

            // Approve player2 to spend 50 tokens on behalf of player
            await jpfToken.connect(acc).approve(acc2, 50)

            // player2 transfers 50 tokens from player to themselves
            await jpfToken.connect(player2).transferFrom(acc, acc2, 50)

            // Check balances
            expect(await jpfToken.balanceOf(acc)).to.equal(50)
            expect(await jpfToken.balanceOf(acc2)).to.equal(50)
        })

        it("Should fail if the sender doesn't have enough tokens", async function () {
            // Approve player2 to spend 100 tokens on behalf of player
            await jpfToken.connect(acc).approve(acc2.address, 100)

            // Try to transfer 100 tokens from player to player2 (should fail as player has 0 tokens)
            await expect(
                jpfToken.connect(acc2).transferFrom(acc.address, acc2.address, 100)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance")
        })

        it("Should fail if the spender doesn't have enough allowance", async function () {
            // Transfer 100 tokens from deployer to player
            await jpfToken.transfer(acc.address, 100)

            // Approve player2 to spend 50 tokens on behalf of player
            await jpfToken.connect(acc).approve(acc2.address, 50)

            // Try to transfer 100 tokens from player to player2 (should fail due to insufficient allowance)
            await expect(
                jpfToken.connect(acc2).transferFrom(acc.address, acc2.address, 100)
            ).to.be.revertedWith("ERC20: insufficient allowance")
        })
    })
})
