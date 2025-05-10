import { ethers } from "hardhat";
import { Tournament, Tournament__factory } from "../typechain-types";

async function main() {
    const provider = ethers.provider;
    const [Deployer] = await ethers.getSigners();

    console.log("Deployer account:", Deployer.address);
    console.log(
      "Account balance:",
      (await provider.getBalance(Deployer.address)).toString(),
    );
  
    console.log("\n===== Deploy Tournament Contract =====");
    const TournamentFactory = (await ethers.getContractFactory(
      "Tournament",
      Deployer,
    )) as Tournament__factory;
    const mock: Tournament = await TournamentFactory.deploy(Deployer.address, "0x5988Bf243ADf1b42a2Ec2e9452D144A90b1FD9A9");
    console.log("Tx Hash: %s", mock.deploymentTransaction()?.hash);
    await mock.deploymentTransaction()?.wait();

    console.log("Tournament Contract: ", await mock.getAddress());
    console.log("\n===== DONE =====");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
