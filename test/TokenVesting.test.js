const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenVesting", function () {
  let TokenVesting;
  let MockERC20;
  let vesting;
  let token;
  let owner;
  let beneficiary;
  let addr1;
  let startTime;
  let duration;
  const amount = ethers.parseEther("1000"); // 1000 tokens

  beforeEach(async function () {
    // Get signers
    [owner, beneficiary, addr1] = await ethers.getSigners();

    // Deploy mock ERC20 token
    MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Mock Token", "MTK");
    await token.waitForDeployment();

    // Deploy vesting contract
    TokenVesting = await ethers.getContractFactory("TokenVesting");
    vesting = await TokenVesting.deploy();
    await vesting.waitForDeployment();

    // Add token to supported tokens
    await vesting.addSupportedToken(await token.getAddress());

    // Mint tokens to owner
    await token.mint(owner.address, amount * BigInt(2));
    
    // Approve vesting contract to spend tokens
    await token.approve(await vesting.getAddress(), amount * BigInt(2));

    // Set up vesting schedule parameters
    startTime = await time.latest();
    duration = 365 * 24 * 60 * 60; // 1 year
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await vesting.owner()).to.equal(owner.address);
    });

    it("Should mark the token as supported", async function () {
      expect(await vesting.supportedTokens(await token.getAddress())).to.be.true;
    });
  });

  describe("Token Support Management", function () {
    it("Should allow owner to add supported token", async function () {
      await expect(vesting.addSupportedToken(addr1.address))
        .to.emit(vesting, "TokenSupported")
        .withArgs(addr1.address);
    });

    it("Should allow owner to remove supported token", async function () {
      await expect(vesting.removeSupportedToken(await token.getAddress()))
        .to.emit(vesting, "TokenUnsupported")
        .withArgs(await token.getAddress());
    });

    it("Should not allow non-owner to add supported token", async function () {
      await expect(vesting.connect(addr1).addSupportedToken(addr1.address))
        .to.be.revertedWithCustomError(vesting, "OwnableUnauthorizedAccount");
    });
  });

  describe("Creating Vesting Schedule", function () {
    it("Should create a vesting schedule", async function () {
      await expect(vesting.createVestingSchedule(
        beneficiary.address,
        await token.getAddress(),
        amount,
        startTime,
        duration,
        true
      )).to.emit(vesting, "TokensLocked")
        .withArgs(beneficiary.address, await token.getAddress(), amount, startTime, startTime + duration);
    });

    it("Should not allow creating schedule for unsupported token", async function () {
      await expect(vesting.createVestingSchedule(
        beneficiary.address,
        addr1.address,
        amount,
        startTime,
        duration,
        true
      )).to.be.revertedWithCustomError(vesting, "TokenNotSupported");
    });

    it("Should not allow zero amount", async function () {
      await expect(vesting.createVestingSchedule(
        beneficiary.address,
        await token.getAddress(),
        0,
        startTime,
        duration,
        true
      )).to.be.revertedWithCustomError(vesting, "InvalidAmount");
    });
  });

  describe("Claiming Tokens", function () {
    beforeEach(async function () {
      await vesting.createVestingSchedule(
        beneficiary.address,
        await token.getAddress(),
        amount,
        startTime,
        duration,
        true
      );
    });

    it("Should calculate correct claimable amount", async function () {
      // Move halfway through vesting period
      await time.increase(duration / 2);

      const claimable = await vesting.calculateClaimableAmount(beneficiary.address, 0);
      const expectedAmount = amount / BigInt(2);
      
      // Allow for small rounding differences
      expect(claimable).to.be.closeTo(expectedAmount, ethers.parseEther("0.000001"));
    });

    it("Should allow claiming vested tokens", async function () {
      await time.increase(duration / 2);
      
      const claimableBefore = await vesting.calculateClaimableAmount(beneficiary.address, 0);
      await expect(vesting.connect(beneficiary).claimTokens(0))
        .to.emit(vesting, "TokensClaimed")
        .withArgs(beneficiary.address, await token.getAddress(), claimableBefore);
    });

    it("Should not allow claiming when no tokens are vested", async function () {
      await expect(vesting.connect(beneficiary).claimTokens(0))
        .to.be.revertedWithCustomError(vesting, "NoClaimableTokens");
    });
  });

  describe("Revoking Vesting", function () {
    beforeEach(async function () {
      await vesting.createVestingSchedule(
        beneficiary.address,
        await token.getAddress(),
        amount,
        startTime,
        duration,
        true
      );
    });

    it("Should allow owner to revoke vesting", async function () {
      await time.increase(duration / 2);
      await expect(vesting.revokeVesting(beneficiary.address, 0))
        .to.emit(vesting, "VestingRevoked");
    });

    it("Should not allow revoking twice", async function () {
      await vesting.revokeVesting(beneficiary.address, 0);
      await expect(vesting.revokeVesting(beneficiary.address, 0))
        .to.be.revertedWithCustomError(vesting, "AlreadyRevoked");
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause", async function () {
      await expect(vesting.pause())
        .to.emit(vesting, "Paused")
        .withArgs(owner.address);
    });

    it("Should not allow creating schedule when paused", async function () {
      await vesting.pause();
      await expect(vesting.createVestingSchedule(
        beneficiary.address,
        await token.getAddress(),
        amount,
        startTime,
        duration,
        true
      )).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow owner to unpause", async function () {
      await vesting.pause();
      await expect(vesting.unpause())
        .to.emit(vesting, "Unpaused")
        .withArgs(owner.address);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await vesting.createVestingSchedule(
        beneficiary.address,
        await token.getAddress(),
        amount,
        startTime,
        duration,
        true
      );
    });

    it("Should return correct vesting schedule count", async function () {
      expect(await vesting.getVestingScheduleCount(beneficiary.address)).to.equal(1);
    });

    it("Should return correct vesting schedule details", async function () {
      const schedule = await vesting.getVestingSchedule(beneficiary.address, 0);
      expect(schedule.token).to.equal(await token.getAddress());
      expect(schedule.totalAmount).to.equal(amount);
      expect(schedule.startTime).to.equal(startTime);
      expect(schedule.endTime).to.equal(startTime + duration);
      expect(schedule.revocable).to.be.true;
      expect(schedule.revoked).to.be.false;
    });
  });
});