import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { Tournament, MockToken20 } from "../typechain-types";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

const keccak256 = ethers.keccak256;

describe.only("Tournament Contract", function () {
  let tournament: Tournament;
  let token: MockToken20;
  let owner: any;
  let authorizer: any;
  let player1: any;
  let player2: any;

  const ENTRY_FEE = ethers.parseEther("10");
  const START_TIME = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const END_TIME = START_TIME + 3600; // 1 hour after start

  beforeEach(async function () {
    [owner, authorizer, player1, player2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MockToken20");
    token = await Token.deploy("Mock Token", "MTK");

    const Tournament = await ethers.getContractFactory("Tournament");
    tournament = await Tournament.deploy(owner.address, (await token.getAddress()));

    await tournament.setAuthorizer(authorizer.address, true);
  });

  describe("Constructor", function () {
    it("Should set the correct owner and payment token", async function () {
      expect(await tournament.owner()).to.equal(owner.address);
      expect(await tournament.paymentToken()).to.equal((await token.getAddress()));
    });
  });

  describe("setAuthorizer", function () {
    it("Should allow owner to set authorizer", async function () {
      await expect(tournament.connect(owner).setAuthorizer(player1.address, true))
        .to.emit(tournament, "SetAuthorizer")
        .withArgs(player1.address, true);
      expect(await tournament.authorizers(player1.address)).to.be.true;
    });

    it("Should allow owner to remove authorizer", async function () {
      await tournament.connect(owner).setAuthorizer(player1.address, true);
      await expect(tournament.connect(owner).setAuthorizer(player1.address, false))
        .to.emit(tournament, "SetAuthorizer")
        .withArgs(player1.address, false);
      expect(await tournament.authorizers(player1.address)).to.be.false;
    });

    it("Should revert if non-owner tries to set authorizer", async function () {
      await expect(tournament.connect(player1).setAuthorizer(player2.address, true))
        .to.be.revertedWithCustomError(tournament, "OwnableUnauthorizedAccount");
    });
  });

  describe("setPaymentToken", function () {
    it("Should allow owner to set payment token", async function () {
      const newToken = await ethers.deployContract("MockToken20", ["New Token", "NTK"]);
      const newTokenAddress = await newToken.getAddress();
      await expect(tournament.connect(owner).setPaymentToken((await newToken.getAddress())))
        .to.emit(tournament, "TokenSet")
        .withArgs(newTokenAddress);
      expect(await tournament.paymentToken()).to.equal(newTokenAddress);
    });

    it("Should revert if non-owner tries to set payment token", async function () {
      const newToken = await ethers.deployContract("MockToken20", ["New Token", "NTK"]);
      const newTokenAddress = await newToken.getAddress();
      await expect(tournament.connect(player1).setPaymentToken(newTokenAddress))
        .to.be.revertedWithCustomError(tournament, "OwnableUnauthorizedAccount");
    });

    it("Should revert if trying to set zero address as payment token", async function () {
      await expect(tournament.connect(owner).setPaymentToken(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(tournament, "SetAddressZero");
    });

    it("Should revert if previous tournament is not finished", async function () {
      await tournament.connect(authorizer).createTournament("Test Tournament", ENTRY_FEE, START_TIME, END_TIME);
      const newToken = await ethers.deployContract("MockToken20", ["New Token", "NTK"]);
      await expect(tournament.connect(owner).setPaymentToken((await newToken.getAddress())))
        .to.be.revertedWithCustomError(tournament, "PreviousTourementNotFinished");
    });
  });

  describe("createTournament", function () {
    let startTime: number, endTime: number;

    it("Should create a new tournament", async function () {
      const timestamp = await time.latest();
      startTime = timestamp + 60 * 60; // start in 1 hour
      endTime = timestamp + 24 * 60 * 60; // end in 24 hour

      await expect(tournament.connect(authorizer).createTournament(
        "Test Tournament",
        ENTRY_FEE,
        startTime,
        endTime
      )).to.emit(tournament, "TournamentCreated");

      const tournamentData = await tournament.tournaments(1);
      expect(tournamentData.name).to.equal("Test Tournament");
      expect(tournamentData.entryFee).to.equal(ENTRY_FEE);
    });

    it("Should revert if non-authorizer tries to create a tournament", async function () {
      await expect(tournament.connect(player1).createTournament(
        "Test Tournament",
        ENTRY_FEE,
        START_TIME,
        END_TIME
      )).to.be.revertedWith("Not authorized");
    });

    it("Should revert if start time is not in the future", async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      await expect(tournament.connect(authorizer).createTournament(
        "Test Tournament",
        ENTRY_FEE,
        pastTime,
        END_TIME
      )).to.be.revertedWith("Start time must be in the future");
    });

    it("Should revert if end time is before start time", async function () {
      await expect(tournament.connect(authorizer).createTournament(
        "Test Tournament",
        ENTRY_FEE,
        START_TIME,
        START_TIME - 1
      )).to.be.revertedWith("Invalid tournament duration");
    });

    it("Should revert if previous tournament is not finished", async function () {
      await tournament.connect(authorizer).createTournament("Test Tournament", ENTRY_FEE, START_TIME, END_TIME);
      await expect(tournament.connect(authorizer).createTournament(
        "New Tournament",
        ENTRY_FEE,
        START_TIME + 7200,
        END_TIME + 7200
      )).to.be.revertedWithCustomError(tournament, "PreviousTourementNotFinished");
    });
  });

  describe("enterTournament", function () {
    beforeEach(async function () {
      await tournament.connect(authorizer).createTournament(
        "Test Tournament",
        ENTRY_FEE,
        START_TIME,
        END_TIME
      );
      await token.connect(player1).mint(player1.address, ethers.parseEther("100"));
      await token.connect(player1).approve(await tournament.getAddress(), ENTRY_FEE);
    });

    it("Should allow a player to enter a tournament", async function () {
      await time.increaseTo(START_TIME);
      await expect(tournament.connect(player1).enterTournament(1))
        .to.emit(tournament, "PlayerEntered")
        .withArgs(1, player1.address);
    });

    it("Should revert if tournament is not active", async function () {
      await expect(tournament.connect(player1).enterTournament(1))
        .to.be.revertedWith("Tournament is not active");
    });

    it("Should revert if player has insufficient tokens", async function () {
      await time.increaseTo(START_TIME);
      await expect(tournament.connect(player2).enterTournament(1))
        .to.be.revertedWith("Token transfer failed");
    });

    it("Should revert if tournament does not exist", async function () {
      await time.increaseTo(START_TIME);
      await expect(tournament.connect(player1).enterTournament(2))
        .to.be.revertedWith("Tournament does not exist");
    });
  });

  describe("updateWinners", function () {
    beforeEach(async function () {
      await tournament.connect(authorizer).createTournament(
        "Test Tournament",
        ENTRY_FEE,
        START_TIME,
        END_TIME
      );
    });

    it("Should allow authorizer to update winners", async function () {
      const winnerCount = 3;
      const winnersRoot = ethers.keccak256(ethers.toUtf8Bytes("winnersRoot"));
      
      await expect(tournament.connect(authorizer).updateWinners(1, winnerCount, winnersRoot))
        .to.emit(tournament, "WinnersRootUpdated")
        .withArgs(1);
      
      const tournamentData = await tournament.tournaments(1);
      expect(tournamentData.winnerCount).to.equal(winnerCount);
      expect(tournamentData.winnersRoot).to.equal(winnersRoot);
    });

    it("Should revert if non-authorizer tries to update winners", async function () {
      const winnerCount = 3;
      const winnersRoot = ethers.keccak256(ethers.toUtf8Bytes("winnersRoot"));
      
      await expect(tournament.connect(player1).updateWinners(1, winnerCount, winnersRoot))
        .to.be.revertedWith("Not authorized");
    });

    it("Should revert if tournament is not active", async function () {
      const winnerCount = 3;
      const winnersRoot = ethers.keccak256(ethers.toUtf8Bytes("winnersRoot"));
      
      await expect(tournament.connect(authorizer).updateWinners(1, winnerCount, winnersRoot))
        .to.be.revertedWith("Tournament is not active");
    });
  });

  describe("claim", function () {
    let startTime: number, endTime: number;
    let currentTournamentId: bigint;
    let merkleTree: StandardMerkleTree<string[]>;
  
    beforeEach(async function () {
      const timestamp = await time.latest();
      startTime = timestamp + 60 * 60; // start in 1 hour
      endTime = timestamp + 24 * 60 * 60; // end in 24 hour
      await tournament.connect(authorizer).createTournament(
        "Test Tournament",
        ENTRY_FEE,
        startTime,
        endTime
      );
      await token.connect(player1).mint(player1.address, ethers.parseEther("100"));
      await token.connect(player1).approve(await tournament.getAddress(), ENTRY_FEE);
      currentTournamentId = await tournament.currTournamentId();
      await tournament.connect(player1).enterTournament(currentTournamentId);

      const winners = [[player1.address], [player2.address]];
      merkleTree = StandardMerkleTree.of(winners, ['address']);
    });
  
    it("Should allow winner to claim prize", async function () {
      const winnerCount = 1;
      const winnersRoot = merkleTree.root;
      await tournament.connect(authorizer).updateWinners(currentTournamentId, winnerCount, winnersRoot);
      const proof = merkleTree.getProof([player1.address]);
      await expect(tournament.connect(player1).claim(currentTournamentId, proof))
        .to.emit(tournament, "PrizeClaimed")
        .withArgs(currentTournamentId, player1.address, ENTRY_FEE);
    });

    it("Should revert if non-participant tries to claim", async function () {
      const winnerCount = 1;
      const winnersRoot = merkleTree.root;
      await tournament.connect(authorizer).updateWinners(currentTournamentId, winnerCount, winnersRoot);
  
      await time.increaseTo(endTime + 1);
  
      const proof = merkleTree.getProof([player1.address]);
  
      await expect(tournament.connect(player2).claim(currentTournamentId, proof))
        .to.be.revertedWithCustomError(tournament, "NotParticipated");
    });
  
    it("Should revert if tournament has not ended", async function () {
      await time.increaseTo(endTime - 100);
      const proof = merkleTree.getProof([player1.address])
      await expect(tournament.connect(player1).claim(currentTournamentId, proof))
        .to.be.revertedWith("Tournament is not finished");
    });
  
    it("Should revert if player has already claimed", async function () {
      const winnerCount = 2;
      const winnersRoot = merkleTree.root
      await tournament.connect(authorizer).updateWinners(currentTournamentId, winnerCount, winnersRoot);
  
      await time.increaseTo(endTime + 1);
  
      const proof = merkleTree.getProof([player1.address])
  
      await tournament.connect(player1).claim(currentTournamentId, proof);
      await expect(tournament.connect(player1).claim(currentTournamentId, proof))
        .to.be.revertedWithCustomError(tournament, "AlreadyClaimed");
    });
  
    it("Should revert if tournament does not exist", async function () {
      const proof = merkleTree.getProof([player1.address])
      await expect(tournament.connect(player1).claim(2, proof))
        .to.be.revertedWith("Tournament does not exist");
    });
  
    it("Should revert if proof is invalid", async function () {
      const winnerCount = 2;
      const winnersRoot = merkleTree.root;
      await tournament.connect(authorizer).updateWinners(currentTournamentId, winnerCount, winnersRoot);
  
      await time.increaseTo(endTime + 1);
  
      const invalidProof = [ethers.keccak256(ethers.toUtf8Bytes("invalid"))];
      await expect(tournament.connect(player1).claim(currentTournamentId, invalidProof))
        .to.be.revertedWithCustomError(tournament, "NotWinner");
    });
  });
});