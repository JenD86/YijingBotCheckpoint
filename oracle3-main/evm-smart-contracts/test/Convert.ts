import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import type { BytesLike, TypedDataDomain } from "ethers";
import { ethers } from "hardhat";

import type {
  Address,
  Charms,
  Charms__factory,
  Convert,
  Convert__factory,
} from "../typechain-types";

const convertTypes = {
  Convert: [
    { name: "pool", type: "address" },
    { name: "to", type: "address" },
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
};

async function gen_convert_sig(
  signer: HardhatEthersSigner,
  pool: Address | string,
  to: Address | string,
  token: Address | string,
  amount: bigint,
  nonce: bigint,
  expiry: bigint,
  domain: TypedDataDomain,
): Promise<string> {
  const values = {
    pool: pool,
    to: to,
    token: token,
    amount: amount,
    nonce: nonce,
    expiry: expiry,
  };
  return await signer.signTypedData(domain, convertTypes, values);
}

const Zero = 0;
const MAX256 = ethers.MaxUint256;
const ZeroAddress = ethers.ZeroAddress;
const MAX_TOTAL_SUPPLY = ethers.parseUnits((1_000_000).toString(), "ether");

describe("Convert Contract Testing", () => {
  let admin: HardhatEthersSigner;
  let accounts: HardhatEthersSigner[];

  let charms: Charms, convert: Convert;
  let domain: TypedDataDomain,
    invalidDomain1: TypedDataDomain,
    invalidDomain2: TypedDataDomain;

  const provider = ethers.provider;
  let usedSignature = "";
  let usedExpiry = 0;

  before(async () => {
    [admin, ...accounts] = await ethers.getSigners();

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

    const Convert = (await ethers.getContractFactory(
      "Convert",
      admin,
    )) as Convert__factory;
    convert = await Convert.deploy(admin.address);

    const chainId = (await provider.getNetwork()).chainId;
    domain = {
      name: "Convert Points to Tokens",
      version: "Version 1",
      chainId: chainId,
      verifyingContract: await convert.getAddress(),
    };
    invalidDomain1 = {
      name: "Convert Points to Tokens",
      version: "version 1",
      chainId: 100, //  wrong chainId
      verifyingContract: await convert.getAddress(),
    };
    invalidDomain2 = {
      name: "Convert Points to Tokens",
      version: "version 1",
      chainId: chainId,
      verifyingContract: await charms.getAddress(), //  wrong contract address
    };

    // Redistribution Pool approve an amount of allowance
    await charms
      .connect(accounts[0])
      .approve(await convert.getAddress(), MAX256);
  });

  it("Should be able to check the initialized settings of Charms contract", async () => {
    expect(await convert.owner()).deep.eq(admin.address);
  });

  describe("setAuthorizer() functional testing", async () => {
    it("Should revert when Non-Ownership role tries to set Authorizer", async () => {
      expect(await convert.authorizers(accounts[0].address)).deep.eq(false);

      await expect(
        convert.connect(accounts[0]).setAuthorizer(accounts[0].address, true),
      ).to.be.revertedWithCustomError(convert, "OwnableUnauthorizedAccount");

      expect(await convert.authorizers(accounts[0].address)).deep.eq(false);
    });

    it("Should succeed when Owner set a new Authorizer", async () => {
      expect(await convert.authorizers(accounts[0].address)).deep.eq(false);

      const tx = convert
        .connect(admin)
        .setAuthorizer(accounts[0].address, true);
      await expect(tx)
        .to.emit(convert, "SetAuthorizer")
        .withArgs(accounts[0].address, true);

      expect(await convert.authorizers(accounts[0].address)).deep.eq(true);
    });

    it("Should succeed when Owner set Address Zero (0x0) as a new Authorizer", async () => {
      expect(await convert.authorizers(ZeroAddress)).deep.eq(false);

      const tx = convert.connect(admin).setAuthorizer(ZeroAddress, true);
      await expect(tx)
        .to.emit(convert, "SetAuthorizer")
        .withArgs(ZeroAddress, true);

      expect(await convert.authorizers(ZeroAddress)).deep.eq(true);
    });

    it("Should succeed when Owner remove an existing Authorizer", async () => {
      expect(await convert.authorizers(accounts[0].address)).deep.eq(true);

      const tx = convert
        .connect(admin)
        .setAuthorizer(accounts[0].address, false);
      await expect(tx)
        .to.emit(convert, "SetAuthorizer")
        .withArgs(accounts[0].address, false);

      expect(await convert.authorizers(accounts[0].address)).deep.eq(false);
    });
  });

  describe("transferOwnership() and ownership functional testing", async () => {
    it("Should succeed when Owner transfer its onwership to another", async () => {
      expect(await convert.owner()).deep.eq(admin.address);

      const tx = convert.connect(admin).transferOwnership(accounts[0].address);
      await expect(tx)
        .to.emit(convert, "OwnershipTransferred")
        .withArgs(admin.address, accounts[0].address);

      expect(await convert.owner()).deep.eq(accounts[0].address);
    });

    it("Should revert when Former Owner tries to set Authorizer", async () => {
      expect(await convert.authorizers(accounts[0].address)).deep.eq(false);

      await expect(
        convert.connect(admin).setAuthorizer(accounts[0].address, true),
      ).to.be.revertedWithCustomError(convert, "OwnableUnauthorizedAccount");

      expect(await convert.authorizers(accounts[0].address)).deep.eq(false);
    });

    it("Should succeed when New Owner remove the existing Authorizer", async () => {
      expect(await convert.authorizers(ZeroAddress)).deep.eq(true);

      const tx = convert.connect(accounts[0]).setAuthorizer(ZeroAddress, false);
      await expect(tx)
        .to.emit(convert, "SetAuthorizer")
        .withArgs(ZeroAddress, false);

      expect(await convert.authorizers(ZeroAddress)).deep.eq(false);

      //  set back to normal
      await convert.connect(accounts[0]).transferOwnership(admin.address);
      await convert.connect(admin).setAuthorizer(admin.address, true);
    });
  });

  describe("convert() functional testing", async () => {
    it("Should revert when User sends a convert request with an expired signature", async () => {
      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const expiredTime: number = timestamp - 1;

      const nonce = await convert.nonces(accounts[5].address);
      const amount = ethers.parseUnits("100", "ether");
      const signature: BytesLike = await gen_convert_sig(
        admin,
        accounts[0].address,
        accounts[5].address,
        await charms.getAddress(),
        amount,
        nonce,
        BigInt(expiredTime),
        domain,
      );

      const poolBalance = await charms.balanceOf(accounts[0].address);
      const accountBalance = await charms.balanceOf(accounts[5].address);

      await expect(
        convert
          .connect(accounts[5])
          .convert(
            accounts[0].address,
            await charms.getAddress(),
            amount,
            BigInt(expiredTime),
            signature,
          ),
      ).to.be.revertedWithCustomError(convert, "SignatureExpired");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(poolBalance);
      expect(await charms.balanceOf(accounts[5].address)).deep.eq(
        accountBalance,
      );
    });

    it("Should revert when User sends a convert request with an invalid signature - Unauthorized Signer", async () => {
      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const expiry: number = timestamp + 15 * 60;

      const nonce = await convert.nonces(accounts[5].address);
      const amount = ethers.parseUnits("100", "ether");
      const signature: BytesLike = await gen_convert_sig(
        accounts[5],
        accounts[0].address,
        accounts[5].address,
        await charms.getAddress(),
        amount,
        nonce,
        BigInt(expiry),
        domain,
      );

      const poolBalance = await charms.balanceOf(accounts[0].address);
      const accountBalance = await charms.balanceOf(accounts[5].address);

      await expect(
        convert
          .connect(accounts[5])
          .convert(
            accounts[0].address,
            await charms.getAddress(),
            amount,
            BigInt(expiry),
            signature,
          ),
      ).to.be.revertedWithCustomError(convert, "InvalidSignature");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(poolBalance);
      expect(await charms.balanceOf(accounts[5].address)).deep.eq(
        accountBalance,
      );
    });

    it("Should revert when User sends a convert request with an invalid signature - Expiry", async () => {
      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const expiredTime: number = timestamp - 1;

      const nonce = await convert.nonces(accounts[5].address);
      const amount = ethers.parseUnits("100", "ether");
      const signature: BytesLike = await gen_convert_sig(
        admin,
        accounts[0].address,
        accounts[5].address,
        await charms.getAddress(),
        amount,
        nonce,
        BigInt(expiredTime),
        domain,
      );

      const poolBalance = await charms.balanceOf(accounts[0].address);
      const accountBalance = await charms.balanceOf(accounts[5].address);

      await expect(
        convert
          .connect(accounts[5])
          .convert(
            accounts[0].address,
            await charms.getAddress(),
            amount,
            BigInt(timestamp + 15 * 60),
            signature,
          ),
      ).to.be.revertedWithCustomError(convert, "InvalidSignature");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(poolBalance);
      expect(await charms.balanceOf(accounts[5].address)).deep.eq(
        accountBalance,
      );
    });

    it("Should revert when User sends a convert request with an invalid signature - Pool Address", async () => {
      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const expiry: number = timestamp + 15 * 60;

      const nonce = await convert.nonces(accounts[5].address);
      const amount = ethers.parseUnits("100", "ether");
      const signature: BytesLike = await gen_convert_sig(
        admin,
        accounts[0].address,
        accounts[5].address,
        await charms.getAddress(),
        amount,
        nonce,
        BigInt(expiry),
        domain,
      );

      const poolBalance = await charms.balanceOf(accounts[1].address);
      const accountBalance = await charms.balanceOf(accounts[5].address);

      await expect(
        convert
          .connect(accounts[5])
          .convert(
            accounts[1].address,
            await charms.getAddress(),
            amount,
            BigInt(expiry),
            signature,
          ),
      ).to.be.revertedWithCustomError(convert, "InvalidSignature");

      expect(await charms.balanceOf(accounts[1].address)).deep.eq(poolBalance);
      expect(await charms.balanceOf(accounts[5].address)).deep.eq(
        accountBalance,
      );
    });

    it("Should revert when User sends a convert request with an invalid signature - Sender Address", async () => {
      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const expiry: number = timestamp + 15 * 60;

      const nonce = await convert.nonces(accounts[5].address);
      const amount = ethers.parseUnits("100", "ether");
      const signature: BytesLike = await gen_convert_sig(
        admin,
        accounts[0].address,
        accounts[5].address,
        await charms.getAddress(),
        amount,
        nonce,
        BigInt(expiry),
        domain,
      );

      const poolBalance = await charms.balanceOf(accounts[0].address);
      const account1Balance = await charms.balanceOf(accounts[5].address);
      const account2Balance = await charms.balanceOf(accounts[6].address);

      await expect(
        convert
          .connect(accounts[6])
          .convert(
            accounts[0].address,
            await charms.getAddress(),
            amount,
            BigInt(expiry),
            signature,
          ),
      ).to.be.revertedWithCustomError(convert, "InvalidSignature");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(poolBalance);
      expect(await charms.balanceOf(accounts[5].address)).deep.eq(
        account1Balance,
      );
      expect(await charms.balanceOf(accounts[6].address)).deep.eq(
        account2Balance,
      );
    });

    it("Should revert when User sends a convert request with an invalid signature - Token Address", async () => {
      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const expiry: number = timestamp + 15 * 60;

      const nonce = await convert.nonces(accounts[5].address);
      const amount = ethers.parseUnits("100", "ether");
      const signature: BytesLike = await gen_convert_sig(
        admin,
        accounts[0].address,
        accounts[5].address,
        await charms.getAddress(),
        amount,
        nonce,
        BigInt(expiry),
        domain,
      );

      const poolBalance = await charms.balanceOf(accounts[0].address);
      const accountBalance = await charms.balanceOf(accounts[5].address);

      await expect(
        convert
          .connect(accounts[5])
          .convert(
            accounts[0].address,
            await convert.getAddress(),
            amount,
            BigInt(expiry),
            signature,
          ),
      ).to.be.revertedWithCustomError(convert, "InvalidSignature");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(poolBalance);
      expect(await charms.balanceOf(accounts[5].address)).deep.eq(
        accountBalance,
      );
    });

    it("Should revert when User sends a convert request with an invalid signature - Amount", async () => {
      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const expiry: number = timestamp + 15 * 60;

      const nonce = await convert.nonces(accounts[5].address);
      const amount = ethers.parseUnits("100", "ether");
      const signature: BytesLike = await gen_convert_sig(
        admin,
        accounts[0].address,
        accounts[5].address,
        await charms.getAddress(),
        amount,
        nonce,
        BigInt(expiry),
        domain,
      );

      const poolBalance = await charms.balanceOf(accounts[0].address);
      const accountBalance = await charms.balanceOf(accounts[5].address);

      await expect(
        convert
          .connect(accounts[5])
          .convert(
            accounts[0].address,
            await charms.getAddress(),
            BigInt(3) * amount,
            BigInt(expiry),
            signature,
          ),
      ).to.be.revertedWithCustomError(convert, "InvalidSignature");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(poolBalance);
      expect(await charms.balanceOf(accounts[5].address)).deep.eq(
        accountBalance,
      );
    });

    it("Should revert when User sends a convert request with an invalid signature - Nonce", async () => {
      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const expiry: number = timestamp + 15 * 60;

      const nonce = await convert.nonces(accounts[5].address);
      const amount = ethers.parseUnits("100", "ether");
      const signature: BytesLike = await gen_convert_sig(
        admin,
        accounts[0].address,
        accounts[5].address,
        await charms.getAddress(),
        amount,
        nonce + BigInt(1),
        BigInt(expiry),
        domain,
      );

      const poolBalance = await charms.balanceOf(accounts[0].address);
      const accountBalance = await charms.balanceOf(accounts[5].address);

      await expect(
        convert
          .connect(accounts[5])
          .convert(
            accounts[0].address,
            await charms.getAddress(),
            amount,
            BigInt(expiry),
            signature,
          ),
      ).to.be.revertedWithCustomError(convert, "InvalidSignature");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(poolBalance);
      expect(await charms.balanceOf(accounts[5].address)).deep.eq(
        accountBalance,
      );
    });

    it("Should succeed when User sends a convert request with a valid signature", async () => {
      const block: number = await provider.getBlockNumber();
      const timestamp: number = (await provider.getBlock(block))
        ?.timestamp as number;
      const expiry: number = timestamp + 15 * 60;

      const nonce = await convert.nonces(accounts[5].address);
      const amount = ethers.parseUnits("100", "ether");
      const signature: BytesLike = await gen_convert_sig(
        admin,
        accounts[0].address,
        accounts[5].address,
        await charms.getAddress(),
        amount,
        nonce,
        BigInt(expiry),
        domain,
      );
      usedSignature = signature;
      usedExpiry = expiry;

      const tx = convert
        .connect(accounts[5])
        .convert(
          accounts[0].address,
          await charms.getAddress(),
          amount,
          BigInt(expiry),
          signature,
        );

      await expect(tx)
        .to.emit(convert, "Converted")
        .withArgs(
          admin.address, //  signer
          accounts[5].address, //  sender
          nonce,
          await charms.getAddress(),
          amount,
        );
      await expect(tx).changeTokenBalances(
        charms,
        [accounts[0].address, accounts[5].address],
        [-amount, amount],
      );
    });

    it("Should revert when User sends a convert request with used signature", async () => {
      const amount = ethers.parseUnits("100", "ether");

      const poolBalance = await charms.balanceOf(accounts[0].address);
      const accountBalance = await charms.balanceOf(accounts[5].address);

      await expect(
        convert
          .connect(accounts[5])
          .convert(
            accounts[0].address,
            await charms.getAddress(),
            amount,
            BigInt(usedExpiry),
            usedSignature,
          ),
      ).to.be.revertedWithCustomError(convert, "InvalidSignature");

      expect(await charms.balanceOf(accounts[0].address)).deep.eq(poolBalance);
      expect(await charms.balanceOf(accounts[5].address)).deep.eq(
        accountBalance,
      );
    });
  });
});
