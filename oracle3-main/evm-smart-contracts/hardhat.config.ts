import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  networks: {
    // Your existing networks
    base_sepolia: {
      url: process.env.BASE_SEPOLIA_RPC ?? "",
      accounts: process.env.TESTNET_DEPLOYER ? [process.env.TESTNET_DEPLOYER] : [],
      chainId: 84532,
      timeout: 900000,
    },
    base: {
      url: process.env.BASE_MAINNET_RPC ?? "",
      accounts: process.env.MAINNET_DEPLOYER ? [process.env.MAINNET_DEPLOYER] : [],
      chainId: 8453,
      timeout: 900000,
    },
    // Add Polygon networks
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC ?? "",
      accounts: process.env.MAINNET_DEPLOYER ? [process.env.MAINNET_DEPLOYER] : [],
      chainId: 137,
      timeout: 900000,
    }
  },

  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  gasReporter: {
    enabled: true,
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./build/cache",
    artifacts: "./build/artifacts",
  },

  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARB_API_KEY,
      baseSepolia: process.env.BASE_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY
    }
  }
};

export default config;
