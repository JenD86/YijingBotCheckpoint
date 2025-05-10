import { expect } from "chai";
import { ethers } from "hardhat";
import { Point, Point__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Point", function () {
  let PointFactory: Point__factory;
  let point: Point;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    PointFactory = await ethers.getContractFactory("Point");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy a new Point contract before each test
    point = await PointFactory.deploy(owner.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await point.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await point.name()).to.equal("Point");
      expect(await point.symbol()).to.equal("Point");
    });
  });

  describe("Authorizer", function () {
    it("Should allow owner to set authorizer", async function () {
      await point.setAuthorizer(addr1.address, true);
      expect(await point.authorizers(addr1.address)).to.equal(true);
    });

    it("Should emit SetAuthorizer event", async function () {
      await expect(point.setAuthorizer(addr1.address, true))
        .to.emit(point, "SetAuthorizer")
        .withArgs(addr1.address, true);
    });

    it("Should not allow non-owner to set authorizer", async function () {
      await expect(point.connect(addr1).setAuthorizer(addr2.address, true)).to.be.revertedWithCustomError(point, "OwnableUnauthorizedAccount");
    });
  });

  describe("Minting", function () {
    it("Should allow minting with valid signature", async function () {
      const amount = ethers.parseEther("100");
      const nonce = 0;
      const block: number = await ethers.provider.getBlockNumber();
      const timestamp: number = (await ethers.provider.getBlock(block))
        ?.timestamp as number;
      const expiry = timestamp + 3600; // 1 hour from now

      // Set addr1 as an authorizer
      await point.setAuthorizer(addr1.address, true);

      // Create the message hash
      const domain = {
        name: "Point",
        version: "Version 1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: (await point.getAddress()),
      };

      const types = {
        Point: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint256" },
        ],
      };

      const value = {
        to: addr2.address,
        amount: amount,
        nonce: nonce,
        expiry: expiry,
      };

      // Sign the message
      const signature = await addr1.signTypedData(domain, types, value);
      // Mint tokens
      await point.connect(addr2).mint(amount, expiry, signature);

      // Check balance
      expect(await point.balanceOf(addr2.address)).to.equal(amount);
    });

    it("Should revert if signature is expired", async function () {
      const amount = ethers.parseEther("100");
      const nonce = 0;

      const block: number = await ethers.provider.getBlockNumber();
      const timestamp: number = (await ethers.provider.getBlock(block))
        ?.timestamp as number;
      const expiry = timestamp - 3600; // 1 hour ago

      // Set addr1 as an authorizer
      await point.setAuthorizer(addr1.address, true);

      // Create the message hash
      const domain = {
        name: "Point",
        version: "Version 1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: (await point.getAddress()),
      };

      const types = {
        Point: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint256" },
        ],
      };

      const value = {
        to: addr2.address,
        amount: amount,
        nonce: nonce,
        expiry: expiry,
      };

      // Sign the message
      const signature = await addr1.signTypedData(domain, types, value);

      // Attempt to mint tokens with expired signature
      await expect(point.mint(amount, expiry, signature)).to.be.revertedWithCustomError(point, "SignatureExpired");
    });

    it("Should revert if signer is not an authorizer", async function () {
      const amount = ethers.parseEther("100");
      const nonce = 0;
      const block: number = await ethers.provider.getBlockNumber();
      const timestamp: number = (await ethers.provider.getBlock(block))
        ?.timestamp as number;
      const expiry = timestamp + 3600; // 1 hour from now

      // Create the message hash
      const domain = {
        name: "Point",
        version: "Version 1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: point.address,
      };

      const types = {
        Point: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint256" },
        ],
      };

      const value = {
        to: addr2.address,
        amount: amount,
        nonce: nonce,
        expiry: expiry,
      };

      // Sign the message
      const signature = await addr1.signTypedData(domain, types, value);

      // Attempt to mint tokens with unauthorized signer
      await expect(point.connect(addr2).mint(amount, expiry, signature)).to.be.revertedWithCustomError(point, "InvalidSignature");
    });
  });
});