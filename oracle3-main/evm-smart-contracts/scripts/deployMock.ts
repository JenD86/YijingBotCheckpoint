import { ethers } from "hardhat";
import { MockJackpot, MockJackpot__factory } from "../typechain-types";

async function main() {
  const provider = ethers.provider;
  const [Deployer] = await ethers.getSigners();

  console.log("Deployer account:", Deployer.address);
  console.log(
    "Account balance:",
    (await provider.getBalance(Deployer.address)).toString(),
  );

  console.log("\n===== Deploy MockJackpot Contract =====");
  const MockJackpotFactory = (await ethers.getContractFactory(
    "MockJackpot",
    Deployer,
  )) as MockJackpot__factory;
  const mock: MockJackpot = await MockJackpotFactory.deploy();
  console.log("Tx Hash: %s", mock.deploymentTransaction()?.hash);
  await mock.deploymentTransaction()?.wait();

  console.log("MockJackpot Contract: ", await mock.getAddress());

  console.log("\n===== DONE =====");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
