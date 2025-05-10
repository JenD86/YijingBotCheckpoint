import { ethers } from "hardhat";
import hre from "hardhat";
import { MockToken20, MockToken20__factory } from "../typechain-types";

async function main() {
    const provider = ethers.provider;
    const [Deployer] = await ethers.getSigners();

    console.log("Deployer account:", Deployer.address);
    console.log(
      "Account balance:",
      (await provider.getBalance(Deployer.address)).toString(),
    );
  
    console.log("\n===== Deploy MockToken20 Contract =====");
    const MockToken20Factory = (await ethers.getContractFactory(
      "MockToken20",
      Deployer,
    )) as MockToken20__factory;
    const mock: MockToken20 = await MockToken20Factory.deploy("MockToken20", "MockToken20");
    console.log("Tx Hash: %s", mock.deploymentTransaction()?.hash);
    await mock.deploymentTransaction()?.wait();

    console.log("MockToken20 Contract: ", await mock.getAddress());
    console.log("Verify Tourament Contract ......");
    
    await hre.run("verify:verify", {
      address: await mock.getAddress(),
      constructorArguments: [
        "MockToken20", "MockToken20"
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