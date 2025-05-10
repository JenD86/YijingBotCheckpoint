import { ethers } from "hardhat";

async function main() {
    // Replace these with your actual addresses
    const initialOwner = "0x4eF4D0A801B590215303269750E43Df662B7Ddfc";
    const paymentToken = "0x5988Bf243ADf1b42a2Ec2e9452D144A90b1FD9A9";

    // For Point contract
    const pointABI = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [initialOwner]
    );
    console.log("Point Constructor ABI-encoded:");
    console.log(pointABI);

    // For Tournament contract
    const tournamentABI = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address"],
        [initialOwner, paymentToken]
    );
    console.log("\nTournament Constructor ABI-encoded:");
    console.log(tournamentABI);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
