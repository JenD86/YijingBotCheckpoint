import { ethers } from "hardhat";
import {
  Charms,
  Charms__factory,
  Convert,
  Convert__factory,
  Jackpot,
  Jackpot__factory,
} from "../typechain-types";

const MAX_TOTAL_SUPPLY = ethers.parseUnits((1_000_000).toString(), "ether");

async function main() {
  const provider = ethers.provider;
  const [Deployer] = await ethers.getSigners();

  console.log("Deployer account:", Deployer.address);
  console.log(
    "Account balance:",
    (await provider.getBalance(Deployer.address)).toString(),
  );

  console.log("\n===== Deploy $CHARMS Token Contract =====");
  const distributions: Charms.DistributionStruct[] = [
    {
      beneficiary: Deployer.address,
      percentage: 10_000, // 10_000 * 100 / DENOM = 100%
    },
  ];
  const CharmsFactory = (await ethers.getContractFactory(
    "Charms",
    Deployer,
  )) as Charms__factory;
  const charms: Charms = await CharmsFactory.deploy(
    MAX_TOTAL_SUPPLY,
    distributions,
  );
  console.log("Tx Hash: %s", charms.deploymentTransaction()?.hash);
  await charms.deploymentTransaction()?.wait();

  console.log("$CHARMS Token Contract: ", await charms.getAddress());

  console.log("\n===== Deploy Jackpot Contract =====");
  const JackpotFactory = (await ethers.getContractFactory(
    "Jackpot",
    Deployer,
  )) as Jackpot__factory;
  const startTime = 1726133400;
  const windowTime = 24 * 3600; // 24-hours
  const jackpot: Jackpot = await JackpotFactory.deploy(
    Deployer.address,
    startTime,
    windowTime,
    await charms.getAddress(),
  );
  console.log("Tx Hash: %s", jackpot.deploymentTransaction()?.hash);
  await jackpot.deploymentTransaction()?.wait();

  console.log("Jackpot Contract: ", await jackpot.getAddress());

  // console.log("\n===== Deploy Convert Contract =====");
  // const ConvertFactory = (await ethers.getContractFactory(
  //   "Convert",
  //   Deployer,
  // )) as Convert__factory;
  // const convert: Convert = await ConvertFactory.deploy(Deployer.address);

  // console.log("Tx Hash: %s", convert.deploymentTransaction()?.hash);
  // await convert.deploymentTransaction()?.wait();

  // console.log("Convert Contract: ", await convert.getAddress());

  console.log("\n===== Set Operator =====");
  let tx = await jackpot.connect(Deployer).setOperator(Deployer.address, true);
  console.log("Tx Hash:", tx.hash);
  await tx.wait();

  console.log("\n===== Set Base Prize =====");
  const basePrize = ethers.parseUnits("10", "ether");
  tx = await jackpot.connect(Deployer).setBasePrize(basePrize);
  console.log("Tx Hash:", tx.hash);
  await tx.wait();

  console.log("\n===== DONE =====");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
