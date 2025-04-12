const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { Block } = require("ethers");

const HALF_HOUR = 30 * 60;
const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * 60 * 60;
const SIX_DAYS = 6 * ONE_DAY;
const ONE_MONTH = 30 * ONE_DAY;

async function main() {
  console.log("Checking current time...");
  console.log(
    "Current Time: ",
    new Date(await ethers.provider.getBlock("latest")).toString()
  );
  console.log("Moving time forward...");

  await time.increase(SIX_DAYS);

  console.log("Moved interval/s forward.");

  console.log("Checking updated current time...");
  console.log(
    "Updated current time: ",
    new Date(await ethers.provider.getBlock("latest")).toString()
  );
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
