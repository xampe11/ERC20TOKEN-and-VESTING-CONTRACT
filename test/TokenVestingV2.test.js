const { expect } = require("chai")
const { ethers } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-network-helpers")

describe("TokenVesting", function () {
    let TokenVesting
    let TestToken
    let tokenVesting
    let testToken
    let owner
    let beneficiary
    let addr2
    let addrs

    // Constants for testing
    const TOTAL_AMOUNT = ethers.parseEther("1000")
    const ONE_DAY = 24 * 60 * 60
    const ONE_WEEK = 7 * ONE_DAY
    const ONE_MONTH = 30 * ONE_DAY
    const RELEASE_PERCENTAGE = 2500 // 20% in basis points

    beforeEach(async function () {
        // Get signers
        ;[owner, beneficiary, addr2, ...addrs] = await ethers.getSigners()

        // Deploy test token
        TestToken = await ethers.getContractFactory("MockERC20") // You'll need to create this
        testToken = await TestToken.deploy("Mock Token", "MTK")
        await testToken.waitForDeployment()

        // Deploy TokenVesting contract
        TokenVesting = await ethers.getContractFactory("TokenVestingV2")
        tokenVesting = await TokenVesting.deploy()
        await tokenVesting.waitForDeployment()

        // Mint tokens to owner
        await testToken.mint(owner.address, TOTAL_AMOUNT * BigInt(2))

        // Approve tokens for vesting
        await testToken.approve(tokenVesting.target, TOTAL_AMOUNT)
    })

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await tokenVesting.owner()).to.equal(owner.address)
        })
    })

    describe("Creating Vesting Schedule", function () {
        it("Should create a vesting schedule with release", async function () {
            const startTime = (await time.latest()) + ONE_DAY
            const duration = ONE_MONTH
            const releaseInterval = ONE_WEEK

            await tokenVesting.createVestingScheduleWithRelease(
                beneficiary.address,
                testToken.target,
                TOTAL_AMOUNT,
                startTime,
                duration,
                releaseInterval,
                RELEASE_PERCENTAGE,
                true
            )

            const schedule = await tokenVesting.vestingSchedules(beneficiary.address, 0)
            expect(schedule.token).to.equal(testToken.target)
            expect(schedule.totalAmount).to.equal(TOTAL_AMOUNT)
            expect(schedule.startTime).to.equal(startTime)
            expect(schedule.endTime).to.equal(startTime + duration)
            expect(schedule.claimedAmount).to.equal(0)
            expect(schedule.revocable).to.be.true
            expect(schedule.revoked).to.be.false
        })
    })

    describe("Calculating Claimable Amount", function () {
        let startTime

        beforeEach(async function () {
            startTime = (await time.latest()) + ONE_DAY
            await tokenVesting.createVestingScheduleWithRelease(
                beneficiary.address,
                testToken.target,
                TOTAL_AMOUNT,
                startTime,
                ONE_MONTH,
                ONE_WEEK,
                RELEASE_PERCENTAGE,
                true
            )
            await testToken.approve(tokenVesting.target, TOTAL_AMOUNT)
        })

        it("Should return 0 if vesting hasn't started", async function () {
            const claimable = await tokenVesting.calculateClaimableAmount(beneficiary.address, 0)
            expect(claimable).to.equal(0)
        })

        it("Should calculate correct claimable amount after one release period", async function () {
            await time.increaseTo(startTime + ONE_WEEK)

            const claimable = await tokenVesting.calculateClaimableAmount(beneficiary.address, 0)
            const expectedAmount =
                (((BigInt(TOTAL_AMOUNT) * BigInt(7)) / BigInt(30)) * BigInt(RELEASE_PERCENTAGE)) /
                BigInt(10000)
            expect(claimable).to.equal(expectedAmount)
        })

        it("Should calculate correct claimable amount at vesting end", async function () {
            const schedule = await tokenVesting.vestingSchedules(beneficiary.address, 0)

            await time.increaseTo(startTime + ONE_MONTH)

            if ((await time.latest()) >= schedule.endTime) {
                vestedAmount = schedule.totalAmount
                console.log("End Time has passed, available amount: ", vestedAmount)
            } else {
                const timeElapsed = BigInt(await time.latest()) - schedule.startTime
                const vestingDuration = schedule.endTime - schedule.startTime
                vestedAmount = (schedule.totalAmount * timeElapsed) / vestingDuration
                console.log("End Time still not reached, available amount: ", vestedAmount)
            }

            const releasableAmount = vestedAmount - schedule.claimedAmount

            console.log("start + one month: ", startTime + ONE_MONTH)
            console.log("time.latest : ", BigInt(await time.latest()) / BigInt(24 * 60 * 60))
            console.log(
                "nextReleaseTime: ",
                schedule.releaseSchedule.nextReleaseTime / BigInt(24 * 60 * 60)
            )

            const periodsPassed =
                (BigInt(await time.latest()) - schedule.releaseSchedule.nextReleaseTime) /
                    schedule.releaseSchedule.releaseInterval +
                BigInt(1)

            console.log(
                "Latest - nextRelease: ",
                (BigInt(await time.latest()) - schedule.releaseSchedule.nextReleaseTime) /
                    BigInt(24 * 60 * 60)
            )

            console.log(
                "Latest - nextRelease / releaseInterval : ",
                (BigInt(await time.latest()) - schedule.releaseSchedule.nextReleaseTime) /
                    schedule.releaseSchedule.releaseInterval
            )

            console.log("Periods Passed: ", periodsPassed)

            const maxReleasablePercentage =
                periodsPassed * schedule.releaseSchedule.releasePercentage
            if (maxReleasablePercentage > 10000) {
                maxReleasablePercentage = 10000
            }
            console.log("Max Releasable Percentage: ", maxReleasablePercentage)

            const claimable = await tokenVesting.calculateClaimableAmount(beneficiary.address, 0)
            expect(claimable).to.equal(TOTAL_AMOUNT)
        })

        describe("Claiming Tokens", function () {
            let startTime

            beforeEach(async function () {
                startTime = (await time.latest()) + ONE_DAY
                await tokenVesting.createVestingScheduleWithRelease(
                    beneficiary.address,
                    testToken.target,
                    TOTAL_AMOUNT,
                    startTime,
                    ONE_MONTH,
                    ONE_WEEK,
                    RELEASE_PERCENTAGE,
                    true
                )
            })

            it("Should allow claiming available tokens", async function () {
                await time.increaseTo(startTime + ONE_WEEK * 2)

                console.log(
                    "Total locked: ",
                    ethers.parseEther("1000") / BigInt(10) ** BigInt(await testToken.decimals())
                )

                const claimableBefore = await tokenVesting.calculateClaimableAmount(
                    beneficiary.address,
                    0
                )

                console.log(
                    "Claimable amount before claiming: ",
                    BigInt(claimableBefore) / BigInt(10) ** BigInt(await testToken.decimals())
                )

                await tokenVesting.connect(beneficiary).claimTokens(0)

                const schedule = await tokenVesting.vestingSchedules(beneficiary.address, 0)

                console.log(
                    "Claimed amount: ",
                    BigInt(schedule.claimedAmount) /
                        BigInt(10) ** BigInt(await testToken.decimals())
                )

                expect(
                    BigInt(schedule.claimedAmount) /
                        BigInt(10) ** BigInt(await testToken.decimals())
                ).to.equal(
                    BigInt(claimableBefore) / BigInt(10) ** BigInt(await testToken.decimals())
                )
            })

            it("Should revert if no tokens are claimable", async function () {
                await expect(
                    tokenVesting.connect(beneficiary).claimTokens(0)
                ).to.be.revertedWithCustomError(tokenVesting, "NoClaimableTokens")
            })

            it("Should update next release time after claim", async function () {
                await time.increaseTo(startTime + ONE_WEEK)
                await tokenVesting.connect(beneficiary).claimTokens(0)

                const releaseSchedule = await tokenVesting.getReleaseSchedule(
                    beneficiary.address,
                    0
                )
                expect(releaseSchedule.nextReleaseTime).to.equal(startTime + 2 * ONE_WEEK)
            })
        })

        describe("Contract Security", function () {
            it("Should prevent reentrancy attacks", async function () {
                // Implementation depends on your test token's ability to simulate reentrancy
            })

            it("Should pause and unpause correctly", async function () {
                await tokenVesting.pause()
                expect(await tokenVesting.paused()).to.be.true

                const startTime = (await time.latest()) + ONE_DAY
                await expect(
                    tokenVesting.createVestingScheduleWithRelease(
                        beneficiary.address,
                        testToken.target,
                        TOTAL_AMOUNT,
                        startTime,
                        ONE_MONTH,
                        ONE_WEEK,
                        RELEASE_PERCENTAGE,
                        true
                    )
                ).to.be.reverted

                await tokenVesting.unpause()
                expect(await tokenVesting.paused()).to.be.false
            })
        })
    })
})
