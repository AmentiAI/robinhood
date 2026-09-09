require("dotenv").config();

const RH_RPC_URL = process.env.RH_RPC_URL || "https://rpc.testnet.chain.robinhood.com";
const RH_PRIVATE_KEY = process.env.RH_PLATFORM_PRIVATE_KEY || process.env.PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },
  networks: {
    hardhat: {},
    robinhoodTestnet: {
      url: process.env.RH_TESTNET_RPC_URL || "https://rpc.testnet.chain.robinhood.com",
      chainId: 46630,
      accounts: RH_PRIVATE_KEY ? [RH_PRIVATE_KEY] : [],
    },
    robinhood: {
      url: RH_RPC_URL,
      chainId: 4663,
      accounts: RH_PRIVATE_KEY ? [RH_PRIVATE_KEY] : [],
    },
  },
};
