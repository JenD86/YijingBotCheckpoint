import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  console.log("Verify $CHARMS Token Contract ......");
  const Charms = "";
  const owner = "0x31003C2D5685c7D28D7174c3255307Eb9a0f3015";

  await hre.run("verify:verify", {
    address: Charms,
    constructorArguments: [owner],
  });

  console.log("Verify Convert Contract ......");
  const Convert = "";

  await hre.run("verify:verify", {
    address: Convert,
    constructorArguments: [owner],
  });

  console.log("Verify Jackpot Contract ......");
  const Jackpot = "";
  const startTime = 1726133400; //  replace
  const windowTime = 24 * 3600; // 24-hours

  await hre.run("verify:verify", {
    address: Jackpot,
    constructorArguments: [owner, startTime, windowTime, Charms],
  });

  console.log("Verify MockJackpot Contract ......");
  const MockJackpot = "";

  await hre.run("verify:verify", {
    address: MockJackpot,
    constructorArguments: [],
  });

  console.log("\n===== DONE =====");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
