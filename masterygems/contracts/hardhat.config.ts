import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    monadTestnet: {
      url: process.env.MONAD_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },

import * as dotenv from "dotenv";

dotenv.config();

const MONAD_RPC_URL = process.env.MONAD_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    monadTestnet: {
      url: MONAD_RPC_URL || "https://your-monad-testnet-rpc.example",
      // Nếu chưa set PRIVATE_KEY thì để array rỗng để tránh hardhat crash
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {},
  },

};

export default config;
