"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = exports.domain = void 0;
const env_1 = require("./env");
// EIP-712 domain configuration
exports.domain = {
    name: "OTPSystem",
    version: "1",
    chainId: env_1.CHAIN_ID,
    verifyingContract: env_1.CONTRACT_ADDRESS,
};
// EIP-712 struct types
exports.types = {
    OTPRequest: [
        { name: "transactionId", type: "bytes32" },
        { name: "hashedOtp", type: "bytes32" },
        { name: "userAddress", type: "address" },
        { name: "expirationTime", type: "uint256" },
    ],
};
