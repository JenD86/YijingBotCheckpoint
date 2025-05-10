import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Verify Point Contract ......");
  const [Deployer] = await ethers.getSigners();
  
  await hre.run("verify:verify", {
    address: "0x8107266de2d006Fa308A36d729E973707289DC52", // Replace with the actual deployed Point contract address
    constructorArguments: [
      Deployer.address,
    ],
  });

  console.log("\n===== DONE =====");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });