import type { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import type { TypedDataDomain } from "ethers";
import type {
  Address,
  Charms,
  Charms__factory,
  Jackpot,
  Jackpot__factory,
} from "../typechain-types";

const provider: HardhatEthersProvider = ethers.provider;
const Zero = BigInt(0);

const hour = 3_600;
const day = 24 * hour;
const MAX_TOTAL_SUPPLY = ethers.parseUnits((1_000_000).toString(), "ether");

const purchaseTypes = {
  Purchase: [
    { name: "account", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
};

async function gen_purchase_sig(
  signer: HardhatEthersSigner,
  account: Address | string,
  nonce: bigint,
  expiry: bigint,
  domain: TypedDataDomain,
): Promise<string> {
  const values = {
    account: account,
    nonce: nonce,
    expiry: expiry,
  };
  return await signer.signTypedData(domain, purchaseTypes, values);
}

async function adjustTime(nextTimestamp: number): Promise<void> {
  await time.increaseTo(nextTimestamp);
}

describe("Jackpot Contract Testing", () => {
  let admin: HardhatEthersSigner,
    operator: HardhatEthersSigner,
    authorizer: HardhatEthersSigner;
  let accounts: HardhatEthersSigner[];

  let START_TIME = 0;
  const WINDOW_TIME: number = 1 * day;
  const basePrize: bigint = ethers.parseUnits("10", "ether");

  let charms: Charms, jackpot: Jackpot;
  let domain: TypedDataDomain;

  before(async () => {
    [admin, operator, authorizer, ...accounts] = await ethers.getSigners();

    const distributions: Charms.DistributionStruct[] = [
      {
        beneficiary: accounts[0].address, //  redistribution pool
        percentage: 5_000, // 5_000 * 100 / 10_000 = 50%
      },
      {
        beneficiary: accounts[1].address, //  investors
        percentage: 3_000, // 3_000 * 100 / 10_000 = 30%
      },
      {
        beneficiary: accounts[2].address, //  ecosystem
        percentage: 1_900, // 1_900 * 100 / 10_000 = 19%
      },
      {
        beneficiary: accounts[3].address, //  1st jackpot prize
        percentage: 100, // 100 * 100 / 10_000 = 1%
      },
    ];

    const Charms = (await ethers.getContractFactory(
      "Charms",
      admin,
    )) as Charms__factory;
    charms = await Charms.deploy(MAX_TOTAL_SUPPLY, distributions);

    const block: number = await provider.getBlockNumber();
    const timestamp: number = (await provider.getBlock(block))
      ?.timestamp as number;
    START_TIME = timestamp + 12 * hour;

    const Jackpot = (await ethers.getContractFactory(
      "Jackpot",
      admin,
    )) as Jackpot__factory;
    jackpot = await Jackpot.deploy(
      admin.address,
      START_TIME,
      WINDOW_TIME,
      await charms.getAddress(),
    );

    const chainId = (await provider.getNetwork()).chainId;
    domain = {
      name: "Jackpot",
      version: "Version 1",
      chainId: chainId,
      verifyingContract: await jackpot.getAddress(),
    };

    // 1st Jackpot Pool approve an amount of allowance
    await charms
      .connect(accounts[3])
      .approve(
        await jackpot.getAddress(),
        await charms.balanceOf(accounts[3].address),
      );
    //  set Operator and Authorizer
    await jackpot.connect(admin).setOperator(operator.address, true);
    await jackpot.connect(admin).setAuthorizer(authorizer.address, true);

    // set `basePrize`
    await jackpot.connect(operator).setBasePrize(basePrize);
  });

  it("Should be able to check the initialized settings of Jackpot contract", async () => {
    expect(await jackpot.START_TIME()).deep.eq(START_TIME);
    expect(await jackpot.WINDOW_TIME()).deep.eq(WINDOW_TIME);
    expect(await jackpot.TOKEN()).deep.eq(await charms.getAddress());
    expect(await jackpot.isPending()).deep.eq(false);
    expect(await jackpot.basePrize()).deep.eq(basePrize);
    expect(await jackpot.operators(operator.address)).deep.eq(true);
    expect(await jackpot.authorizers(authorizer.address)).deep.eq(true);
  });
  describe("purchase() functional testing", async () => {
    it("Should succeed to purchase a ticket", async () => {
      let block: number = await provider.getBlockNumber();
      let timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const startTime = Number(await jackpot.START_TIME());
      if (timestamp < startTime) await adjustTime(startTime);

      const nonce = await jackpot.nonces(accounts[0].address);
      const ticketId = await jackpot.getTicketId(accounts[0].address, nonce);
      const gameId = await jackpot.getCurrentGameId();
      const { numOfTickets: slot, totalReward } = await jackpot.games(gameId);

      block = await provider.getBlockNumber();
      timestamp = (await provider.getBlock(block))?.timestamp as number;
      const expiry = timestamp + 5 * 60; // 5mins expiring time
      const signature = await gen_purchase_sig(
        authorizer,
        accounts[0].address,
        nonce,
        BigInt(expiry),
        domain,
      );

      const tx = jackpot.connect(accounts[0]).purchase(expiry, signature);

      await expect(tx)
        .to.emit(jackpot, "Purchased")
        .withArgs(accounts[0].address, ticketId, gameId, slot);

      const updatedTotalReward = totalReward + basePrize;
      const expectedGameUpdate = [
        updatedTotalReward, //  totalReward
        slot + BigInt(1), // numOfTickets
        Zero, // winningTicketId
        false, // Reward's status
      ];
      const expectedTicketInfo = [gameId, accounts[0].address];

      expect(await jackpot.games(gameId)).deep.eq(expectedGameUpdate);
      expect(await jackpot.tickets(ticketId)).deep.eq(expectedTicketInfo);
      expect(await jackpot.nonces(accounts[0].address)).deep.eq(
        nonce + BigInt(1),
      );
      expect(await jackpot.gameSlots(gameId, slot)).deep.eq(ticketId);
    });
  });
});
