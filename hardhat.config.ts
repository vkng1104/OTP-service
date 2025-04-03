import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
if (privateKey === undefined) {
  throw new Error("Environment variable MY_ENV_VAR is not set");
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.ETHEREUM_PROVIDER_URL,
      accounts: [privateKey],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
    },
  },
  paths: {
    sources: "./src/contracts",
    tests: "./src/test",
    cache: "./src/cache",
    artifacts: "./src/artifacts",
  },
};

export default config;
