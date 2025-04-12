const { ethers } = require("hardhat");

async function main() {
  console.log("Getting contract information...");
  const token = await ethers.getContract("JPFToken");

  const [deployer, player, player2] = await ethers.getSigners();

  console.log("deployer: ", deployer.address);

  const tokenVesting = await ethers.getContract("TokenVestingV2");

  console.log("Token Contract: ", token.target);
  console.log("Vesting Contract: ", tokenVesting.target);
  console.log("Information gathered successfully.");

  console.log(
    "Balance of deployer: ",
    (await token.balanceOf(deployer.address)) /
      BigInt(10) ** BigInt(await token.decimals())
  );

  console.log("Claiming tokens...");

  try {
    await tokenVesting.claimTokens(0);
    console.log("Tokens claimed.");
  } catch (error) {
    console.log("Not able to Claim Tokens Yet");
    console.log(error);
  }

  //await tokenVesting.claimTokens(0)

  //console.log("Tokens claimed.")

  console.log(
    "Balance of deployer: ",
    (await token.balanceOf(deployer.address)) /
      BigInt(10) ** BigInt(await token.decimals())
  );

  console.log("Checking total remaining locked tokens...");

  const schedule = await tokenVesting.vestingSchedules(deployer.address, 0);

  console.log(
    "Total remaining tokens: ",
    (schedule.totalAmount - schedule.claimedAmount) /
      BigInt(10) ** BigInt(await token.decimals())
  );
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
