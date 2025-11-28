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

import * as dotenv from "dotenv";

dotenv.config();

const MONAD_RPC_URL = process.env.MONAD_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    monadMainnet: {
      url: MONAD_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],

    },
  },
};

export default config;
