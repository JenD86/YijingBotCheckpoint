import type { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import type {
  Address,
  Charms,
  Charms__factory,
  JackpotV2,
  JackpotV2__factory,
} from "../typechain-types";

const provider: HardhatEthersProvider = ethers.provider;

const Zero = BigInt(0);
const ZeroAddress: Address | string = ethers.ZeroAddress;
const BurningAddress = "0x000000000000000000000000000000000000dEaD";
const hour = 3_600;
const day = 24 * hour;

const DENOM = BigInt(1_000_000); // DENOM set in the smart contract
const MAX_TOTAL_SUPPLY = ethers.parseUnits((1_000_000).toString(), "ether");
const ticketPrice = ethers.parseUnits("10", "ether");

const emptySettings = [BigInt(0), []];

async function adjustTime(nextTimestamp: number): Promise<void> {
  await time.increaseTo(nextTimestamp);
}

describe("JackpotV2 Contract Testing", () => {
  let admin: HardhatEthersSigner, operator: HardhatEthersSigner;
  let accounts: HardhatEthersSigner[];

  let START_TIME = 0;
  const WINDOW_TIME: number = 1 * day;

  let charms: Charms, jackpot: JackpotV2;

  let ticketDistributions: JackpotV2.DistributionStruct[] = [];

  before(async () => {
    [admin, operator, ...accounts] = await ethers.getSigners();

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
      "JackpotV2",
      admin,
    )) as JackpotV2__factory;
    jackpot = await Jackpot.deploy(
      admin.address,
      START_TIME,
      WINDOW_TIME,
      await charms.getAddress(),
    );

    ticketDistributions = [
      {
        receiver: await jackpot.getAddress(),
        percentage: BigInt(200_000), // 200_000 * 100 / 1_000_000 = 20%
      },
      {
        receiver: accounts[0].address, // redistribution pool
        percentage: BigInt(400_000), // 400_000 * 100 / 1_000_000 = 40%
      },
      {
        receiver: BurningAddress,
        percentage: BigInt(100_000), // 100_000 * 100 / 1_000_000 = 10%
      },
      {
        receiver: accounts[2].address, // ecosystem
        percentage: BigInt(300_000), // 300_000 * 100 / 1_000_000 = 30%
      },
    ];

    // 1st Jackpot Pool approve an amount of allowance
    await charms
      .connect(accounts[3])
      .approve(
        await jackpot.getAddress(),
        await charms.balanceOf(accounts[3].address),
      );
  });

  it("Should be able to check the initialized settings of Jackpot contract", async () => {
    expect(await jackpot.START_TIME()).deep.eq(START_TIME);
    expect(await jackpot.WINDOW_TIME()).deep.eq(WINDOW_TIME);
    expect(await jackpot.TOKEN()).deep.eq(await charms.getAddress());
    expect(await jackpot.isPending()).deep.eq(false);
  });

  describe("setOperator() functional testing", async () => {
    it("Should revert when Non-Ownership role tries to set Operator", async () => {
      expect(await jackpot.operators(accounts[0].address)).deep.eq(false);

      await expect(
        jackpot.connect(accounts[0]).setOperator(accounts[0].address, true),
      ).to.be.revertedWithCustomError(jackpot, "OwnableUnauthorizedAccount");

      expect(await jackpot.operators(accounts[0].address)).deep.eq(false);
    });

    it("Should succeed when Owner set a new Operator", async () => {
      expect(await jackpot.operators(accounts[0].address)).deep.eq(false);

      const tx = jackpot.connect(admin).setOperator(accounts[0].address, true);
      await expect(tx)
        .to.emit(jackpot, "SetOperator")
        .withArgs(accounts[0].address, true);

      expect(await jackpot.operators(accounts[0].address)).deep.eq(true);
    });

    it("Should succeed when Owner set Address Zero (0x0) as a new Operator", async () => {
      expect(await jackpot.operators(ZeroAddress)).deep.eq(false);

      const tx = jackpot.connect(admin).setOperator(ZeroAddress, true);
      await expect(tx)
        .to.emit(jackpot, "SetOperator")
        .withArgs(ZeroAddress, true);

      expect(await jackpot.operators(ZeroAddress)).deep.eq(true);
    });

    it("Should succeed when Owner remove an existing Operator", async () => {
      expect(await jackpot.operators(accounts[0].address)).deep.eq(true);

      const tx = jackpot.connect(admin).setOperator(accounts[0].address, false);
      await expect(tx)
        .to.emit(jackpot, "SetOperator")
        .withArgs(accounts[0].address, false);

      expect(await jackpot.operators(accounts[0].address)).deep.eq(false);
    });
  });

  describe("transferOwnership() and ownership functional testing", async () => {
    it("Should succeed when Owner transfer its onwership to another", async () => {
      expect(await jackpot.owner()).deep.eq(admin.address);

      const tx = jackpot.connect(admin).transferOwnership(accounts[0].address);
      await expect(tx)
        .to.emit(jackpot, "OwnershipTransferred")
        .withArgs(admin.address, accounts[0].address);

      expect(await jackpot.owner()).deep.eq(accounts[0].address);
    });

    it("Should revert when Former Owner tries to set Operator", async () => {
      expect(await jackpot.operators(accounts[0].address)).deep.eq(false);

      await expect(
        jackpot.connect(admin).setOperator(accounts[0].address, true),
      ).to.be.revertedWithCustomError(jackpot, "OwnableUnauthorizedAccount");

      expect(await jackpot.operators(accounts[0].address)).deep.eq(false);
    });

    it("Should succeed when New Owner remove the existing Operator", async () => {
      expect(await jackpot.operators(ZeroAddress)).deep.eq(true);

      const tx = jackpot.connect(accounts[0]).setOperator(ZeroAddress, false);
      await expect(tx)
        .to.emit(jackpot, "SetOperator")
        .withArgs(ZeroAddress, false);

      expect(await jackpot.operators(ZeroAddress)).deep.eq(false);

      //  set back to normal
      await jackpot.connect(accounts[0]).transferOwnership(admin.address);
      await jackpot.connect(admin).setOperator(operator.address, true);
    });
  });

  describe("setPending() functional testing", async () => {
    it("Should revert when Non-Ownership role tries to enable a pending state of Jackpot pool", async () => {
      expect(await jackpot.isPending()).deep.eq(false);

      await expect(
        jackpot.connect(accounts[0]).setPending(true),
      ).to.be.revertedWithCustomError(jackpot, "OwnableUnauthorizedAccount");

      expect(await jackpot.isPending()).deep.eq(false);
    });

    it("Should succeed when Owner enables a pending state of Jackpot pool", async () => {
      expect(await jackpot.isPending()).deep.eq(false);

      await jackpot.connect(admin).setPending(true);

      expect(await jackpot.isPending()).deep.eq(true);
    });

    it("Should succeed when Owner disable a pending state of Jackpot pool", async () => {
      expect(await jackpot.isPending()).deep.eq(true);

      await jackpot.connect(admin).setPending(false);

      expect(await jackpot.isPending()).deep.eq(false);
    });
  });

  describe("initPool() functional testing", async () => {
    it("Should revert when Non-Ownership role tries to call initPool()", async () => {
      const fundingAmount = await charms.balanceOf(accounts[3].address);

      const balance: bigint = await charms.balanceOf(
        await jackpot.getAddress(),
      );

      await expect(
        jackpot
          .connect(accounts[0])
          .initPool(accounts[3].address, fundingAmount),
      ).to.be.revertedWithCustomError(jackpot, "OwnableUnauthorizedAccount");

      expect(await charms.balanceOf(await jackpot.getAddress())).deep.eq(
        balance,
      );
    });

    it("Should succeed when Owner calls to initialize 1st Jackpot pool prize", async () => {
      const fundingAmount = await charms.balanceOf(accounts[3].address);

      const tx = jackpot
        .connect(admin)
        .initPool(accounts[3].address, fundingAmount);
      await expect(tx).changeTokenBalances(
        charms,
        [accounts[3].address, await jackpot.getAddress()],
        [-fundingAmount, fundingAmount],
      );
    });

    it("Should revert when Owner tries to initialize 1st Jackpot pool twice", async () => {
      const fundingAmount = await charms.balanceOf(await jackpot.getAddress());

      const balance: bigint = await charms.balanceOf(
        await jackpot.getAddress(),
      );

      await expect(
        jackpot.connect(admin).initPool(accounts[3].address, fundingAmount),
      ).to.be.revertedWithCustomError(jackpot, "AlreadyInitialized");

      expect(await charms.balanceOf(await jackpot.getAddress())).deep.eq(
        balance,
      );
    });
  });

  describe("updateSettings() functional testing", async () => {
    it("Should revert when Non-Operator role (Arbitrary User) tries to call to update settings", async () => {
      expect(await jackpot.getSettings()).deep.eq(emptySettings);

      await expect(
        jackpot
          .connect(accounts[0])
          .updateSettings(ticketPrice, ticketDistributions),
      ).to.be.revertedWithCustomError(jackpot, "OperatorRoleRequired");

      expect(await jackpot.getSettings()).deep.eq(emptySettings);
    });

    it("Should revert when Non-Operator role (Owner) tries to call to update settings", async () => {
      expect(await jackpot.getSettings()).deep.eq(emptySettings);

      await expect(
        jackpot.connect(admin).updateSettings(ticketPrice, ticketDistributions),
      ).to.be.revertedWithCustomError(jackpot, "OperatorRoleRequired");

      expect(await jackpot.getSettings()).deep.eq(emptySettings);
    });

    it("Should succeed when Operator role calls to update settings", async () => {
      expect(await jackpot.getSettings()).deep.eq(emptySettings);

      const tx = jackpot
        .connect(operator)
        .updateSettings(ticketPrice, ticketDistributions);

      await expect(tx)
        .to.emit(jackpot, "SettingsUpdated")
        .withArgs(operator.address, ticketPrice);

      const expectedDistributions = [
        [await jackpot.getAddress(), BigInt(200_000)],
        [accounts[0].address, BigInt(400_000)],
        [BurningAddress, BigInt(100_000)],
        [accounts[2].address, BigInt(300_000)],
      ];
      expect(await jackpot.getSettings()).deep.eq([
        ticketPrice,
        expectedDistributions,
      ]);
    });

    it("Should succeed when Operator role calls to update settings - Second update", async () => {
      const currentDistributions = [
        [await jackpot.getAddress(), BigInt(200_000)],
        [accounts[0].address, BigInt(400_000)],
        [BurningAddress, BigInt(100_000)],
        [accounts[2].address, BigInt(300_000)],
      ];
      expect(await jackpot.getSettings()).deep.eq([
        ticketPrice,
        currentDistributions,
      ]);

      const distributions: JackpotV2.DistributionStruct[] = [
        {
          receiver: await jackpot.getAddress(),
          percentage: BigInt(500_000), // 500_000 * 100 / 1_000_000 = 50%
        },
        {
          receiver: accounts[0].address, // redistribution pool
          percentage: BigInt(500_000), // 500_000 * 100 / 1_000_000 = 50%
        },
      ];

      const tx = jackpot
        .connect(operator)
        .updateSettings(ticketPrice, distributions);

      await expect(tx)
        .to.emit(jackpot, "SettingsUpdated")
        .withArgs(operator.address, ticketPrice);

      const expectedDistributions = [
        [await jackpot.getAddress(), BigInt(500_000)],
        [accounts[0].address, BigInt(500_000)],
      ];
      expect(await jackpot.getSettings()).deep.eq([
        ticketPrice,
        expectedDistributions,
      ]);

      // set back to normal
      await jackpot
        .connect(operator)
        .updateSettings(ticketPrice, ticketDistributions);
    });
  });

  describe("purchase() functional testing", async () => {
    it("Should revert when User makes a ticket purchase and Jackpot pool has not yet started", async () => {
      await charms
        .connect(accounts[0])
        .transfer(accounts[5].address, ethers.parseUnits("100", "ether"));

      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      expect(await jackpot.START_TIME()).greaterThan(timestamp);

      const balance = await charms.balanceOf(accounts[5].address);

      await expect(
        jackpot.connect(accounts[5]).purchase(),
      ).to.be.revertedWithCustomError(jackpot, "ServiceTemporarilyUnavailable");

      expect(await charms.balanceOf(accounts[5].address)).deep.eq(balance);
    });

    it("Should revert when User makes a ticket purchase and Jackpot pool is currently in a pending state", async () => {
      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const startTime = Number(await jackpot.START_TIME());
      if (timestamp < startTime) await adjustTime(startTime);

      //  temporarily set Jackpot pool to pending state
      await jackpot.connect(admin).setPending(true);
      expect(await jackpot.isPending()).deep.eq(true);

      const balance = await charms.balanceOf(accounts[5].address);

      await expect(
        jackpot.connect(accounts[5]).purchase(),
      ).to.be.revertedWithCustomError(jackpot, "ServiceTemporarilyUnavailable");

      expect(await charms.balanceOf(accounts[5].address)).deep.eq(balance);

      //  set pending state back to "false"
      await jackpot.connect(admin).setPending(false);
      expect(await jackpot.isPending()).deep.eq(false);
    });

    it("Should revert when User, has insufficient tokens, purchases a ticket", async () => {
      expect(await charms.balanceOf(accounts[6].address)).deep.eq(Zero);
      await charms
        .connect(accounts[6])
        .approve(await jackpot.getAddress(), ticketPrice);

      await expect(
        jackpot.connect(accounts[6]).purchase(),
      ).to.be.revertedWithCustomError(charms, "ERC20InsufficientBalance");
    });

    it("Should revert when User, not yet approved an amount of allowance, purchases a ticket", async () => {
      const balance = await charms.balanceOf(accounts[5].address);

      await expect(
        jackpot.connect(accounts[5]).purchase(),
      ).to.be.revertedWithCustomError(charms, "ERC20InsufficientAllowance");

      expect(await charms.balanceOf(accounts[5].address)).deep.eq(balance);
    });

    it("Should succeed when User, has sufficient tokens and approved allowance, purchases a ticket", async () => {
      await charms
        .connect(accounts[5])
        .approve(await jackpot.getAddress(), ticketPrice);

      const nonce = await jackpot.nonces(accounts[5].address);
      const ticketId = await jackpot.getTicketId(accounts[5].address, nonce);
      const gameId = await jackpot.getCurrentGameId();
      const { numOfTickets: slot, totalReward } = await jackpot.games(gameId);

      const tx = jackpot.connect(accounts[5]).purchase();

      await expect(tx)
        .to.emit(jackpot, "Purchased")
        .withArgs(accounts[5].address, ticketId, gameId, slot);

      await expect(tx).changeTokenBalances(
        charms,
        [
          accounts[5].address,
          await jackpot.getAddress(),
          accounts[0].address, //  redistribution pool
          BurningAddress,
          accounts[2].address, // ecosystem
        ],
        [
          -ticketPrice,
          (ticketPrice * BigInt(ticketDistributions[0].percentage)) / DENOM,
          (ticketPrice * BigInt(ticketDistributions[1].percentage)) / DENOM,
          (ticketPrice * BigInt(ticketDistributions[2].percentage)) / DENOM,
          (ticketPrice * BigInt(ticketDistributions[3].percentage)) / DENOM,
        ],
      );

      const updatedTotalReward =
        totalReward +
        (ticketPrice * BigInt(ticketDistributions[0].percentage)) / DENOM;
      const expectedGameUpdate = [
        updatedTotalReward, //  totalReward
        slot + BigInt(1), // numOfTickets
        Zero, // winningTicketId
        false, // Reward's status
      ];
      const expectedTicketInfo = [gameId, accounts[5].address];

      expect(await jackpot.games(gameId)).deep.eq(expectedGameUpdate);
      expect(await jackpot.tickets(ticketId)).deep.eq(expectedTicketInfo);
      expect(await jackpot.nonces(accounts[5].address)).deep.eq(
        nonce + BigInt(1),
      );
      expect(await jackpot.gameSlots(gameId, slot)).deep.eq(ticketId);
    });

    it("Should succeed when Another User, has sufficient tokens and approved allowance, purchases a ticket", async () => {
      await charms
        .connect(accounts[0])
        .transfer(accounts[6].address, ethers.parseUnits("100", "ether"));
      await charms
        .connect(accounts[6])
        .approve(await jackpot.getAddress(), ticketPrice);

      const nonce = await jackpot.nonces(accounts[6].address);
      const ticketId = await jackpot.getTicketId(accounts[6].address, nonce);
      const gameId = await jackpot.getCurrentGameId();
      const { numOfTickets: slot, totalReward } = await jackpot.games(gameId);

      const tx = jackpot.connect(accounts[6]).purchase();

      await expect(tx)
        .to.emit(jackpot, "Purchased")
        .withArgs(accounts[6].address, ticketId, gameId, slot);

      await expect(tx).changeTokenBalances(
        charms,
        [
          accounts[6].address,
          await jackpot.getAddress(),
          accounts[0].address, //  redistribution pool
          BurningAddress,
          accounts[2].address, // ecosystem
        ],
        [
          -ticketPrice,
          (ticketPrice * BigInt(ticketDistributions[0].percentage)) / DENOM,
          (ticketPrice * BigInt(ticketDistributions[1].percentage)) / DENOM,
          (ticketPrice * BigInt(ticketDistributions[2].percentage)) / DENOM,
          (ticketPrice * BigInt(ticketDistributions[3].percentage)) / DENOM,
        ],
      );

      const updatedTotalReward =
        totalReward +
        (ticketPrice * BigInt(ticketDistributions[0].percentage)) / DENOM;
      const expectedGameUpdate = [
        updatedTotalReward, //  totalReward
        slot + BigInt(1), // numOfTickets
        Zero, // winningTicketId
        false, // Reward's status
      ];
      const expectedTicketInfo = [gameId, accounts[6].address];

      expect(await jackpot.games(gameId)).deep.eq(expectedGameUpdate);
      expect(await jackpot.tickets(ticketId)).deep.eq(expectedTicketInfo);
      expect(await jackpot.nonces(accounts[6].address)).deep.eq(
        nonce + BigInt(1),
      );
      expect(await jackpot.gameSlots(gameId, slot)).deep.eq(ticketId);
    });

    it("Should succeed when User, has sufficient tokens and approved allowance, purchases a ticket - Second purchase", async () => {
      await charms
        .connect(accounts[5])
        .approve(await jackpot.getAddress(), ticketPrice);

      const nonce = await jackpot.nonces(accounts[5].address);
      const ticketId = await jackpot.getTicketId(accounts[5].address, nonce);
      const gameId = await jackpot.getCurrentGameId();
      const { numOfTickets: slot, totalReward } = await jackpot.games(gameId);

      const tx = jackpot.connect(accounts[5]).purchase();

      await expect(tx)
        .to.emit(jackpot, "Purchased")
        .withArgs(accounts[5].address, ticketId, gameId, slot);

      await expect(tx).changeTokenBalances(
        charms,
        [
          accounts[5].address,
          await jackpot.getAddress(),
          accounts[0].address, //  redistribution pool
          BurningAddress,
          accounts[2].address, // ecosystem
        ],
        [
          -ticketPrice,
          (ticketPrice * BigInt(ticketDistributions[0].percentage)) / DENOM,
          (ticketPrice * BigInt(ticketDistributions[1].percentage)) / DENOM,
          (ticketPrice * BigInt(ticketDistributions[2].percentage)) / DENOM,
          (ticketPrice * BigInt(ticketDistributions[3].percentage)) / DENOM,
        ],
      );

      const updatedTotalReward =
        totalReward +
        (ticketPrice * BigInt(ticketDistributions[0].percentage)) / DENOM;
      const expectedGameUpdate = [
        updatedTotalReward, //  totalReward
        slot + BigInt(1), // numOfTickets
        Zero, // winningTicketId
        false, // Reward's status
      ];
      const expectedTicketInfo = [gameId, accounts[5].address];

      expect(await jackpot.games(gameId)).deep.eq(expectedGameUpdate);
      expect(await jackpot.tickets(ticketId)).deep.eq(expectedTicketInfo);
      expect(await jackpot.nonces(accounts[5].address)).deep.eq(
        nonce + BigInt(1),
      );
      expect(await jackpot.gameSlots(gameId, slot)).deep.eq(ticketId);
    });
  });

  describe("setWinningTicket() functional testing", async () => {
    it("Should revert Non-Operator role tries to set winning ticketId for one gameId", async () => {
      const gameId = await jackpot.getCurrentGameId();
      const ticketId = await jackpot.gameSlots(gameId, 0);
      const { wonTicketId } = await jackpot.games(gameId);

      await expect(
        jackpot.connect(accounts[0]).setWinningTicket(gameId, ticketId),
      ).to.be.revertedWithCustomError(jackpot, "OperatorRoleRequired");

      const { wonTicketId: newTicket } = await jackpot.games(gameId);
      expect(newTicket).deep.eq(wonTicketId);
    });

    it("Should revert Non-Operator role tries to set winning ticketId for one gameId - Owner", async () => {
      const gameId = await jackpot.getCurrentGameId();
      const ticketId = await jackpot.gameSlots(gameId, 0);
      const { wonTicketId } = await jackpot.games(gameId);

      await expect(
        jackpot.connect(admin).setWinningTicket(gameId, ticketId),
      ).to.be.revertedWithCustomError(jackpot, "OperatorRoleRequired");

      const { wonTicketId: newTicket } = await jackpot.games(gameId);
      expect(newTicket).deep.eq(wonTicketId);
    });

    it("Should revert when Operator tries to set winning ticketId before the game ends", async () => {
      const gameId = await jackpot.getCurrentGameId();
      const ticketId = await jackpot.gameSlots(gameId, 0);
      const { wonTicketId: oldTicket } = await jackpot.games(gameId);

      await expect(
        jackpot.connect(operator).setWinningTicket(gameId, ticketId),
      ).to.be.revertedWithCustomError(jackpot, "GameInProgress");

      const { wonTicketId: newTicket } = await jackpot.games(gameId);
      expect(newTicket).deep.eq(oldTicket);
    });

    it("Should revert when Operator tries to set invalid ticketId as a winning ticket for one game", async () => {
      const gameId = await jackpot.getCurrentGameId();
      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const startTime = Number(await jackpot.START_TIME());
      const windowTime = Number(await jackpot.WINDOW_TIME());
      const endGameTime = startTime + windowTime * Number(gameId);
      if (timestamp < endGameTime) await adjustTime(endGameTime);

      const ticketId = BigInt(0);
      const { wonTicketId: oldTicket } = await jackpot.games(gameId);

      await expect(
        jackpot.connect(operator).setWinningTicket(gameId, ticketId),
      ).to.be.revertedWithCustomError(jackpot, "TicketNotInTheGame");

      const { wonTicketId: newTicket } = await jackpot.games(gameId);
      expect(newTicket).deep.eq(oldTicket);
    });

    it("Should succeed when Operator set a winning ticket for one gameId", async () => {
      const gameId = (await jackpot.getCurrentGameId()) - BigInt(1);
      const ticketId = await jackpot.gameSlots(gameId, 0);
      const { wonTicketId: oldTicket } = await jackpot.games(gameId);

      const tx = jackpot.connect(operator).setWinningTicket(gameId, ticketId);

      await expect(tx)
        .to.emit(jackpot, "WonTicket")
        .withArgs(operator.address, gameId, ticketId);

      const { wonTicketId: newTicket } = await jackpot.games(gameId);
      expect(newTicket).not.eq(oldTicket);
    });

    it("Should revert when Operator tries to update winning ticketId of one game", async () => {
      const gameId = (await jackpot.getCurrentGameId()) - BigInt(1);
      const ticketId = await jackpot.gameSlots(gameId, 1);
      const { wonTicketId: oldTicket } = await jackpot.games(gameId);

      await expect(
        jackpot.connect(operator).setWinningTicket(gameId, ticketId),
      ).to.be.revertedWithCustomError(jackpot, "WonTicketAlreadySet");

      const { wonTicketId: newTicket } = await jackpot.games(gameId);
      expect(newTicket).deep.eq(oldTicket);
    });

    it("Should succeed when Operator set ticketId = 0 as a winning ticket of gameId = 0", async () => {
      const gameId = BigInt(0);
      const ticketId = BigInt(0);
      const { wonTicketId: oldTicket } = await jackpot.games(gameId);
      expect(oldTicket).deep.eq(Zero);

      const tx = jackpot.connect(operator).setWinningTicket(gameId, ticketId);

      await expect(tx)
        .to.emit(jackpot, "WonTicket")
        .withArgs(operator.address, gameId, ticketId);

      const { wonTicketId: newTicket } = await jackpot.games(gameId);
      expect(newTicket).deep.eq(oldTicket);
    });

    it("Should revert when Operator sets a winning ticket of future game", async () => {
      const gameId = (await jackpot.getCurrentGameId()) + BigInt(2);
      const ticketId = BigInt(0);
      const { wonTicketId: oldTicket } = await jackpot.games(gameId);

      await expect(
        jackpot.connect(operator).setWinningTicket(gameId, ticketId),
      ).to.be.revertedWithCustomError(jackpot, "GameInProgress");

      const { wonTicketId: newTicket } = await jackpot.games(gameId);
      expect(newTicket).deep.eq(oldTicket);
    });

    it("Should revert when Operator sets a winning ticket that belongs to a different game", async () => {
      await charms
        .connect(accounts[6])
        .approve(await jackpot.getAddress(), ticketPrice);

      const nonce = (await jackpot.nonces(accounts[6].address)) - BigInt(1);
      const ticketId = await jackpot.getTicketId(accounts[6].address, nonce);
      const gameId = await jackpot.getCurrentGameId();
      expect((await jackpot.tickets(ticketId))[0]).deep.eq(gameId - BigInt(1));

      await jackpot.connect(accounts[6]).purchase();

      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const startTime = Number(await jackpot.START_TIME());
      const windowTime = Number(await jackpot.WINDOW_TIME());
      const endGameTime = startTime + windowTime * Number(gameId);
      if (timestamp < endGameTime) await adjustTime(endGameTime);

      const { wonTicketId: oldTicket } = await jackpot.games(gameId);

      await expect(
        jackpot.connect(operator).setWinningTicket(gameId, ticketId),
      ).to.be.revertedWithCustomError(jackpot, "TicketNotInTheGame");

      const { wonTicketId: newTicket } = await jackpot.games(gameId);
      expect(newTicket).deep.eq(oldTicket);
    });
  });

  describe("claim() functional testing", async () => {
    it("Should revert when User, not an owner of winning ticket, tries to claim a winning jackpot", async () => {
      const gameId = (await jackpot.getCurrentGameId()) - BigInt(2);
      const { wonTicketId } = await jackpot.games(gameId);
      expect((await jackpot.tickets(wonTicketId))[1]).deep.eq(
        accounts[5].address,
      );

      const balance = await charms.balanceOf(accounts[7].address);

      await expect(
        jackpot.connect(accounts[7]).claim(wonTicketId),
      ).to.be.revertedWithCustomError(jackpot, "NotTicketOwner");

      expect(await charms.balanceOf(accounts[7].address)).deep.eq(balance);
    });

    it("Should revert when Operator, not an owner of winning ticket, tries to claim a winning jackpot", async () => {
      const gameId = (await jackpot.getCurrentGameId()) - BigInt(2);
      const { wonTicketId } = await jackpot.games(gameId);
      expect((await jackpot.tickets(wonTicketId))[1]).deep.eq(
        accounts[5].address,
      );

      const balance = await charms.balanceOf(operator.address);

      await expect(
        jackpot.connect(operator).claim(wonTicketId),
      ).to.be.revertedWithCustomError(jackpot, "NotTicketOwner");

      expect(await charms.balanceOf(operator.address)).deep.eq(balance);
    });

    it("Should revert when Owner, not a winning ticket's owner, tries to claim a winning jackpot", async () => {
      const gameId = (await jackpot.getCurrentGameId()) - BigInt(2);
      const { wonTicketId } = await jackpot.games(gameId);
      expect((await jackpot.tickets(wonTicketId))[1]).deep.eq(
        accounts[5].address,
      );

      const balance = await charms.balanceOf(admin.address);

      await expect(
        jackpot.connect(admin).claim(wonTicketId),
      ).to.be.revertedWithCustomError(jackpot, "NotTicketOwner");

      expect(await charms.balanceOf(admin.address)).deep.eq(balance);
    });

    it("Should revert when User, who owns a non-winning ticket, tries to claim a winning jackpot", async () => {
      const gameId = (await jackpot.getCurrentGameId()) - BigInt(2);
      const { wonTicketId } = await jackpot.games(gameId);
      const nonWinningTicketId = await jackpot.gameSlots(gameId, 1);
      expect((await jackpot.tickets(nonWinningTicketId))[1]).deep.eq(
        accounts[6].address,
      );
      expect(nonWinningTicketId).not.eq(wonTicketId);

      const balance = await charms.balanceOf(accounts[6].address);

      await expect(
        jackpot.connect(accounts[6]).claim(nonWinningTicketId),
      ).to.be.revertedWithCustomError(jackpot, "NotAWinner");

      expect(await charms.balanceOf(accounts[6].address)).deep.eq(balance);
    });

    it("Should succeed when User, who owns a winning ticket, calls to claim a jackpot prize", async () => {
      const gameId = (await jackpot.getCurrentGameId()) - BigInt(2);
      const { totalReward, wonTicketId } = await jackpot.games(gameId);
      expect((await jackpot.tickets(wonTicketId))[1]).deep.eq(
        accounts[5].address,
      );

      const tx = jackpot.connect(accounts[5]).claim(wonTicketId);

      await expect(tx)
        .to.emit(jackpot, "Claimed")
        .withArgs(accounts[5].address, gameId, totalReward);
      await expect(tx).changeTokenBalances(
        charms,
        [await jackpot.getAddress(), accounts[5].address],
        [-totalReward, totalReward],
      );

      const { claimed } = await jackpot.games(gameId);
      expect(claimed).deep.eq(true);
    });

    it("Should revert when User tries to claim a jackpot prize twice", async () => {
      const gameId = (await jackpot.getCurrentGameId()) - BigInt(2);
      const { wonTicketId, claimed } = await jackpot.games(gameId);
      expect(claimed).deep.eq(true);

      const balance = await charms.balanceOf(accounts[5].address);

      await expect(
        jackpot.connect(accounts[5]).claim(wonTicketId),
      ).to.be.revertedWithCustomError(jackpot, "AlreadyClaimed");

      expect(await charms.balanceOf(accounts[5].address)).deep.eq(balance);
    });

    it("Should revert when User, using default value of gameId and ticketId, calls to claim a winning prize", async () => {
      // Malicious Operator could set `ticketId = 0` as a winner of `gameId = 0`
      // However, pool prize of this game is Zero amount
      // In addition, `ticketId` is generated by using keccak256
      // Thus, `ticketId = 0` won't be owned by any account
      const gameId = Zero;
      const tokenId = Zero;
      const { wonTicketId, totalReward } = await jackpot.games(gameId);
      expect(tokenId).deep.eq(wonTicketId);
      expect(totalReward).deep.eq(Zero);

      const balance = await charms.balanceOf(accounts[5].address);

      await expect(
        jackpot.connect(accounts[5]).claim(wonTicketId),
      ).to.be.revertedWithCustomError(jackpot, "NotTicketOwner");

      expect(await charms.balanceOf(accounts[5].address)).deep.eq(balance);
    });
  });
});
