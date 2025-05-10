import { ethers } from "hardhat";
import { Point, Point__factory } from "../typechain-types";

const domainName = "Point";
const domainVersion = "Version 1";
const contractAddress = "0x8107266de2d006Fa308A36d729E973707289DC52";

const chainId = 421614;

const domain = {
    name: domainName,
    version: domainVersion,
    chainId: chainId,
    verifyingContract: contractAddress,
};

const types = {
    Point: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
    ],
};

async function main() {
    const [Minter] = await ethers.getSigners();
  
    console.log("Minter account:", Minter.address);
    const PointFactory = (await ethers.getContractFactory(
        "Point",
        Minter
    )) as Point__factory;
    const point = (PointFactory.attach(contractAddress)) as Point;
    const nonce = await point.connect(Minter).nonces(Minter.address);
    console.log("Is minter?: ", await point.connect(Minter).authorizers(Minter.address));
    console.log(
        "Nonce",
        nonce.toString(),
    );

    const to = Minter.address;
    const amount = ethers.parseUnits('1', 18);
    const expiry = Math.floor(Date.now() / 1000) + 3600;

    const message = {
        to: to,
        amount: amount,
        nonce: nonce,
        expiry: expiry,
    };

    const signature = await Minter.signTypedData(domain, types, message);

    await point.connect(Minter).mint(
        amount,
        expiry,
        signature,
    )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });