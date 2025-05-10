import { ethers } from "hardhat";
import { Point, Point__factory } from "../typechain-types";

async function main() {
  const provider = ethers.provider;
  const [Deployer] = await ethers.getSigners();

  console.log("Deployer account:", Deployer.address);
  console.log(
    "Account balance:",
    (await provider.getBalance(Deployer.address)).toString()
  );

  console.log("\n===== Deploy Point Contract =====");
  const PointFactory = (await ethers.getContractFactory(
    "Point",
    Deployer
  )) as Point__factory;
  const point: Point = await PointFactory.deploy(Deployer.address);
  
  console.log("Tx Hash: %s", point.deploymentTransaction()?.hash);
  await point.deploymentTransaction()?.wait();

  console.log("Point Contract: ", await point.getAddress());

  console.log("\n===== DONE =====");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });