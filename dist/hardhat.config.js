"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-toolbox");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const privateKey = process.env.PRIVATE_KEY;
if (privateKey === undefined) {
    throw new Error("Environment variable MY_ENV_VAR is not set");
}
const config = {
    solidity: "0.8.28",
    networks: {
        sepolia: {
            url: process.env.ETHEREUM_PROVIDER_URL,
            accounts: [privateKey],
        },
    },
    paths: {
        sources: "./src/contracts",
        tests: "./src/test",
        cache: "./src/cache",
        artifacts: "./src/artifacts"
    },
};
exports.default = config;
//# sourceMappingURL=hardhat.config.js.map