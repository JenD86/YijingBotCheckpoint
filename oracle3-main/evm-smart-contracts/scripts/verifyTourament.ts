import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Verify Tournament Contract ......");
  
  // Replace these with your actual values
  const contractAddress = "0x7BB89a94331173623a97C905baf4142738A381e0";
  const initialOwner = "0x4eF4D0A801B590215303269750E43Df662B7Ddfc";
  const paymentToken = "0x5988Bf243ADf1b42a2Ec2e9452D144A90b1FD9A9";
  
  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [
      initialOwner,
      paymentToken,
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
