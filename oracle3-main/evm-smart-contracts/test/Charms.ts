import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import type { Charms, Charms__factory } from "../typechain-types";

const name = "$CHARMS Token";
const symbol = "$CHARMS";
const decimals = BigInt(18);
const MAX_TOTAL_SUPPLY = ethers.parseUnits((1_000_000).toString(), "ether");

const Zero = 0;
const ZeroAddress = ethers.ZeroAddress;
const DENOM = BigInt(10_000); //  DENOMINATOR value set in the contract

describe("Charms Contract Testing", () => {
  let admin: HardhatEthersSigner;
  let accounts: HardhatEthersSigner[];

  let charms: Charms;

  before(async () => {
    [admin, ...accounts] = await ethers.getSigners();

    const distributions: Charms.DistributionStruct[] = [
      {
        beneficiary: accounts[0].address, //  redistribution pool
        percentage: 5_000, // 5_000 * 100 / DENOM = 50%
      },
      {
        beneficiary: accounts[1].address, //  investors
        percentage: 3_000, // 3_000 * 100 / DENOM = 30%
      },
      {
        beneficiary: accounts[2].address, //  ecosystem
        percentage: 1_900, // 1_900 * 100 / DENOM = 19%
      },
      {
        beneficiary: accounts[3].address, //  1st jackpot prize
        percentage: 100, // 100 * 100 / DENOM = 1%
      },
    ];

    const Charms = (await ethers.getContractFactory(
      "Charms",
      admin,
    )) as Charms__factory;
    charms = await Charms.deploy(MAX_TOTAL_SUPPLY, distributions);
  });

  it("Should be able to check the initialized settings of Charms contract", async () => {
    expect(await charms.name()).deep.equal(name);
    expect(await charms.symbol()).deep.equal(symbol);
    expect(await charms.decimals()).deep.equal(decimals);

    expect(await charms.MAX_SUPPLY()).deep.eq(MAX_TOTAL_SUPPLY);
    expect(await charms.totalSupply()).deep.eq(MAX_TOTAL_SUPPLY);

    //  Balance of Redistribution Pool
    let percentage = BigInt(5_000);
    expect(await charms.balanceOf(accounts[0].address)).deep.eq(
      (MAX_TOTAL_SUPPLY * percentage) / DENOM,
    );

    //  Balance of Investors
    percentage = BigInt(3_000);
    expect(await charms.balanceOf(accounts[1].address)).deep.eq(
      (MAX_TOTAL_SUPPLY * percentage) / DENOM,
    );

    //  Balance of Ecosystem
    percentage = BigInt(1_900);
    expect(await charms.balanceOf(accounts[2].address)).deep.eq(
      (MAX_TOTAL_SUPPLY * percentage) / DENOM,
    );

    //  Balance of 1st Jackpot Prize
    percentage = BigInt(100);
    expect(await charms.balanceOf(accounts[3].address)).deep.eq(
      (MAX_TOTAL_SUPPLY * percentage) / DENOM,
    );
  });

  describe("transfer() functional testing", async () => {
    it("Should revert when transferring token to Address Zero (0x0)", async () => {
      const amount = ethers.parseUnits("100", "ether");
      const balance = await charms.balanceOf(accounts[0].address);

      await expect(
        charms.connect(accounts[0]).transfer(ZeroAddress, amount),
      ).to.be.revertedWithCustomError(charms, "ERC20InvalidReceiver");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(balance);
    });

    it("Should revert when Sender, has insufficient balance (balance = 0), transfers token to another", async () => {
      const amount = ethers.parseUnits("100", "ether");
      const balance = await charms.balanceOf(admin.address);
      expect(balance).deep.eq(Zero);

      await expect(
        charms.connect(admin).transfer(accounts[0].address, amount),
      ).to.be.revertedWithCustomError(charms, "ERC20InsufficientBalance");

      expect(await charms.balanceOf(admin.address)).deep.eq(balance);
    });

    it("Should revert when Sender, has insufficient balance, transfers token to another", async () => {
      const balance = await charms.balanceOf(accounts[3].address);

      await expect(
        charms
          .connect(accounts[3])
          .transfer(accounts[0].address, balance + BigInt(1)),
      ).to.be.revertedWithCustomError(charms, "ERC20InsufficientBalance");

      expect(await charms.balanceOf(accounts[3].address)).deep.eq(balance);
    });

    it("Should succeed when Sender transfers token to another", async () => {
      const balance = await charms.balanceOf(accounts[3].address);

      const tx = charms
        .connect(accounts[3])
        .transfer(accounts[0].address, balance);

      await expect(tx).changeTokenBalances(
        charms,
        [accounts[3].address, accounts[0].address],
        [-balance, balance],
      );

      await expect(tx)
        .to.emit(charms, "Transfer")
        .withArgs(accounts[3].address, accounts[0].address, balance);
    });
  });

  describe("approve() and allowance() functional testing", async () => {
    it("Should revert when Owner approves an amount of allowance to Address Zero (0x0) as the Spender", async () => {
      const amount = ethers.parseUnits("100", "ether");
      await expect(
        charms.connect(accounts[0]).approve(ZeroAddress, amount),
      ).to.be.revertedWithCustomError(charms, "ERC20InvalidSpender");
    });

    it("Should succeed when Owner approves an amount of allowance to the valid Spender", async () => {
      const amount = ethers.parseUnits("100", "ether");
      expect(
        await charms.allowance(accounts[0].address, admin.address),
      ).deep.eq(Zero);

      const tx = charms.connect(accounts[0]).approve(admin.address, amount);

      await expect(tx)
        .to.emit(charms, "Approval")
        .withArgs(accounts[0].address, admin.address, amount);

      expect(
        await charms.allowance(accounts[0].address, admin.address),
      ).deep.eq(amount);
    });
  });

  describe("transferFrom() functional testing", async () => {
    it("Should revert when Spender, not approved allowance, tries to transfer token from Owner to another", async () => {
      const amount = ethers.parseUnits("200", "ether");
      expect(
        await charms.allowance(accounts[0].address, accounts[1].address),
      ).deep.eq(Zero);

      const balance = await charms.balanceOf(accounts[0].address);

      await expect(
        charms
          .connect(accounts[1])
          .transferFrom(accounts[0].address, accounts[1].address, amount),
      ).to.be.revertedWithCustomError(charms, "ERC20InsufficientAllowance");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(balance);
    });

    it("Should revert when Spender, approved insufficient allowance, tries to transfer token from Owner to another", async () => {
      const amount = ethers.parseUnits("200", "ether");
      expect(
        await charms.allowance(accounts[0].address, admin.address),
      ).lessThan(amount);

      const balance = await charms.balanceOf(accounts[0].address);

      await expect(
        charms
          .connect(admin)
          .transferFrom(accounts[0].address, accounts[1].address, amount),
      ).to.be.revertedWithCustomError(charms, "ERC20InsufficientAllowance");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(balance);
    });

    it("Should revert when Spender, approved sufficient allowance, tries to transfer token from Owner to Address Zero (0x0)", async () => {
      const amount = ethers.parseUnits("100", "ether");
      const balance = await charms.balanceOf(accounts[0].address);

      await expect(
        charms
          .connect(admin)
          .transferFrom(accounts[0].address, ZeroAddress, amount),
      ).to.be.revertedWithCustomError(charms, "ERC20InvalidReceiver");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(balance);
    });

    it("Should succeed when Spender, approved sufficient allowance, transfers tokens from the Owner to another", async () => {
      const amount = ethers.parseUnits("100", "ether");

      const tx = charms
        .connect(admin)
        .transferFrom(accounts[0].address, admin.address, amount);

      await expect(tx).changeTokenBalances(
        charms,
        [accounts[0].address, admin.address],
        [-amount, amount],
      );

      await expect(tx)
        .to.emit(charms, "Transfer")
        .withArgs(accounts[0].address, admin.address, amount);
    });
  });
});
